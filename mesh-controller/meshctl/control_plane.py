"""Explicit etcd pause/resume and full mesh removal, preserving overlay forwarding."""
import base64
import hashlib
import json
import os
from pathlib import Path
import shlex
import threading
import time
import uuid

from .standalone_store import StandaloneStore, atomic_json, encoded, decoded
from .pki import create_ca, issue
from . import records
from .cleanup import cleanup_node

PREFIX = '/mesh/'
END = '/mesh0'
AGENT_TLS = {'ca_file': '/etc/meshagent/tls/ca.crt', 'cert_file': '/etc/meshagent/tls/client.crt',
             'key_file': '/etc/meshagent/tls/client.key'}


class ControlPlane:
    def init_control_plane(self):
        directory = os.environ.get('MESHCTL_STATE_DIR')
        self.plane_path = Path(directory) / 'control-plane.json' if directory else None
        self.plane_store = StandaloneStore(Path(directory) / 'standalone.json') if directory else None
        self.plane_state = json.loads(self.plane_path.read_text()) if self.plane_path and self.plane_path.exists() else {'mode': 'etcd'}
        saved_mesh = self.plane_state.get('mesh_config', {})
        for field in ('etcd_tls', 'pki'):
            if saved_mesh.get(field) and not self.cfg.setdefault('mesh', {}).get(field):
                self.cfg['mesh'][field] = saved_mesh[field]
                self.base_cfg.setdefault('mesh', {})[field] = saved_mesh[field]
        self.standalone_digests = {}
        self.node_operation_lock = threading.Lock()
        if self.plane_path and not (self.cfg.get('mesh') or {}).get('read_via') and not self.cfg.get('entries') and not self.cfg.get('exits') and self.plane_state['mode'] == 'etcd' and not (self.control.get('etcd') or {}).get('members') and not self.plane_state.get('desired_members'):
            self.plane_store.seed({})
            self.save_plane(mode='standalone', desired_members=[], paused_members=[])
        if self.plane_state.get('mode') == 'resuming':
            members = self.plane_state.get('resume_members') or self.plane_state.get('desired_members', [])
            self.save_plane(mode='pausing', paused_members=members, stop_pending=[member['name'] for member in members])
        if self.standalone():
            self.ensure_plane_pki()
            self.load_standalone(collect=False)

    def standalone(self):
        return getattr(self, 'plane_state', {}).get('mode') in ('standalone', 'pausing', 'removed', 'tearing_down', 'resuming')

    def save_plane(self, **patch):
        if self.plane_path is None:
            raise ValueError('persistent controller state is required')
        self.plane_state = {**self.plane_state, 'mesh_config': self.cfg.get('mesh', {}), **patch}
        atomic_json(self.plane_path, self.plane_state)

    def ensure_plane_pki(self):
        mesh = self.cfg.setdefault('mesh', {})
        if mesh.get('etcd_tls') and mesh.get('pki'):
            return
        if mesh.get('etcd_tls') or mesh.get('pki'):
            raise ValueError('existing mesh TLS requires its original CA certificate and issuer key; automatic replacement is disabled')
        directory = self.plane_path.parent / 'pki'
        directory.mkdir(exist_ok=True, mode=0o700)
        ca, key = directory / 'ca.crt', directory / 'ca.key'
        if not ca.exists() or not key.exists():
            if ca.exists() or key.exists():
                raise ValueError('incomplete mesh CA; restore the missing file before continuing')
            certificate, private = create_ca()
            for path, data in [(ca, certificate), (key, private)]:
                descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                with os.fdopen(descriptor, 'w') as output: output.write(data)
        mesh['etcd_tls'] = AGENT_TLS
        mesh['pki'] = {'ca_file': str(ca), 'ca_key_file': str(key)}
        self.base_cfg.setdefault('mesh', {}).update(etcd_tls=AGENT_TLS, pki=mesh['pki'])

    def snapshot_live_store(self):
        response = self.etcd_live_rpc('/kv/range', {'key': encoded(PREFIX), 'range_end': encoded(END)})
        self.plane_store.seed({decoded(row['key']): json.loads(decoded(row['value'])) for row in response.get('kvs', [])})

    def all_node_specs(self):
        result = {}
        for name, record in self.mesh['nodes'].items():
            spec = self._node_spec(name)
            result[name] = {**spec, 'overlay': record['overlay']}
        for name, pending in self.plane_state.get('node_cleanup', {}).items():
            result.setdefault(name, pending['spec'])
        return result

    def pause_etcd(self, name, members, job, desired=None):
        records = self._member_records(members)
        desired = [record for record in records if record['name'] != name] if desired is None else desired
        stop_records = list(records)
        for learner in (row for row in members if row.get('isLearner')):
            learner_name = learner.get('name') or next((node for node, spec in self.mesh['nodes'].items() if 'https://' + spec['overlay'] + ':2381' in learner.get('peerURLs', [])), None)
            if learner_name not in self.mesh['nodes']:
                raise RuntimeError('cannot pause etcd until the learner is registered in mesh')
            stop_records.append({'name': learner_name, **self._node_spec(learner_name)})
        self.snapshot_live_store()
        # Persist the complete journal and cleanup targets BEFORE touching any node.
        self.save_plane(mode='pausing', desired_members=desired, paused_members=stop_records,
                        node_specs=self.all_node_specs(), stop_pending=[record['name'] for record in stop_records])
        self.step(job, 'Fewer than three voters: preserving data and switching mesh to the local journal')
        self.load_standalone(collect=False)
        self.sync_standalone(force=True, strict=True)
        self.finish_pause(job)

    def finish_pause(self, job=None):
        records = self.plane_state.get('paused_members', [])
        errors = []
        for record in records:
            if record['name'] not in self.plane_state.get('stop_pending', []):
                continue
            try:
                from .provision import Node
                node = Node(record['name'], self._node_spec(record['name']), self.ssh)
                node.run('if docker inspect etcd >/dev/null 2>&1; then docker stop etcd >/dev/null; fi', timeout=60)
                self.save_plane(stop_pending=[target for target in self.plane_state['stop_pending'] if target != record['name']])
            except Exception as error:
                errors.append(record['name'])
        if errors:
            raise RuntimeError('etcd stop requires retry on: ' + ', '.join(errors))
        self.save_plane(mode='standalone')
        self.control['operation'] = {'name': 'mesh', 'kind': 'remove', 'stage': 'done'}
        self.plane_store.rpc('/kv/put', {'key': encoded('/mesh/control/operation'), 'value': encoded(json.dumps(self.control['operation']))})
        if job is not None:
            self.step(job, 'etcd stopped on all members; data retained, WireGuard mesh remains active')
        self.event('etcd paused below three voters; mesh continues without etcd', 'etcd')

    def load_standalone(self, collect=True):
        values = self.plane_store.snapshot()
        def prefix(name): return {key.rsplit('/', 1)[1]: value for key, value in values.items() if key.startswith('/mesh/' + name + '/')}
        self.inventory = prefix('inventory'); self.ipmap = prefix('ipmap'); self.relay_state = prefix('relay')
        self.flags = prefix('flags').get('main', {})
        self._load_log(prefix('log'))
        self.control.update(records.control(prefix('control'), records.nodes(prefix('nodes'))))
        nodes = records.nodes(prefix('nodes'))
        observations = prefix('obs'); routes = prefix('route')
        self.mesh = {'etcd_up': False, 'nodes': nodes,
                     'obs': {name: report.get('links', {}) for name, report in observations.items() if 0 <= time.time() - report.get('ts', 0) <= 60},
                     'route': {name: report.get('via', {}) for name, report in routes.items()}}
        self.agent_ts.update({name: report.get('ts', 0) for name, report in observations.items()})
        # Static configuration is only a bootstrap source. A removed mesh cannot resurrect it.
        if self.plane_state.get('mode') in ('removed', 'tearing_down'):
            self.base_cfg['entries'] = {}; self.base_cfg['exits'] = {}
        self.rebuild_cfg()
        if collect and self.plane_state.get('mode') not in ('tearing_down', 'removed'):
            graph = {}
            for name in nodes:
                try:
                    from .provision import Node
                    output = Node(name, self._node_spec(name), self.ssh).run('cat /run/meshagent/status.json', timeout=12)
                    report = json.loads(output)
                    if 0 <= time.time() - report.get('ts', 0) <= 60:
                        graph[name] = report
                        self.agent_ts[name] = report['ts']
                        self.mesh['obs'][name] = report.get('links', {})
                        self.mesh['route'][name] = report.get('via', {})
                except Exception:
                    continue
            self.sync_standalone(graph=graph)
        desired = self.plane_state.get('desired_members', [])
        self.quorum = {'members': [{**record, 'healthy': False, 'leader': False, 'endpoint': record.get('client_url', '')} for record in desired],
                       'healthy': 0, 'size': len(desired), 'quorum': None, 'leader': None}

    def sync_standalone(self, graph=None, force=False, strict=False):
        from .provision import Node
        nodes = self.mesh['nodes']
        if graph is None:
            now = int(time.time())
            graph = {name: {'ts': self.agent_ts.get(name, now), 'links': links}
                     for name, links in self.mesh.get('obs', {}).items()}
        failures = []
        for name in nodes:
            try:
                node = Node(name, self._node_spec(name), self.ssh)
                output = node.run('cat /etc/meshagent/config.json', timeout=12)
                config = json.loads(output)
                config.update(etcd=[], graph_file='/etc/meshagent/graph.json', nodes_file='/etc/meshagent/nodes.json')
                digest = hashlib.sha256(json.dumps([nodes, config], sort_keys=True).encode()).hexdigest()
                if force or self.standalone_digests.get(name) != digest:
                    node.put('/etc/meshagent/nodes.json', json.dumps(nodes), '600')
                    node.put('/etc/meshagent/config.json', json.dumps(config), '600')
                    node.put('/etc/meshagent/graph.json', json.dumps(graph), '600')
                    node.run('systemctl restart meshagent', timeout=30)
                    self.standalone_digests[name] = digest
                else:
                    node.put('/etc/meshagent/graph.json', json.dumps(graph), '600')
            except Exception:
                failures.append(name)
        if failures and strict:
            raise RuntimeError('mesh configuration requires retry on: ' + ', '.join(failures))

    def change_standalone_member(self, name, member, job):
        if self.plane_state.get('mode') == 'pausing':
            self.sync_standalone(force=True, strict=True)
            self.finish_pause(job)
            return
        desired = [record for record in self.plane_state.get('desired_members', []) if record['name'] != name]
        if member:
            spec = self._node_spec(name); overlay = self.mesh['nodes'][name]['overlay']
            desired.append({**spec, 'name': name, 'overlay': overlay, 'client_url': f'https://{overlay}:2389',
                            'peer_url': f'https://{overlay}:2381'})
        self.save_plane(desired_members=desired)
        self.control['operation'] = {'name': name, 'kind': 'add' if member else 'remove', 'stage': 'done'}
        if len(desired) < 3:
            self.step(job, f'etcd remains stopped: {len(desired)} of 3 required members selected; mesh remains active')
            self.load_standalone(collect=False)
            return
        try:
            self.resume_etcd(desired, job)
        except Exception:
            # Durable rollback also covers a controller crash before exception cleanup runs.
            self.save_plane(mode='pausing', paused_members=desired, stop_pending=[record['name'] for record in desired])
            self.load_standalone(collect=False)
            self.sync_standalone(force=True)
            self.finish_pause(job)
            raise

    def resume_etcd(self, records, job):
        from .provision import Node
        self.ensure_plane_pki()
        mesh = self.cfg['mesh']; pki = mesh['pki']
        ca = Path(pki['ca_file']).read_text(); ca_key = Path(pki['ca_key_file']).read_text()
        generation = uuid.uuid4().hex[:12]
        self.save_plane(mode='resuming', resume_generation=generation, resume_members=records)
        cluster = ','.join(record['name'] + '=' + record['peer_url'] for record in records)
        self.step(job, 'At least three members selected: starting a fresh mTLS cluster; previous data is archived')
        for record in records:
            node = Node(record['name'], self._node_spec(record['name']), self.ssh)
            certificate, key = issue(ca, ca_key, 'mesh-member-' + record['name'],
                [record['overlay'], record['host'], '127.0.0.1', 'localhost', record['name']], server=True)
            marker = '/etc/mesh-etcd/rebuild-' + generation
            node.run('command -v docker >/dev/null || (DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io >/dev/null)', timeout=600)
            node.run('docker pull ' + shlex.quote(mesh.get('etcd_image', 'quay.io/coreos/etcd:v3.5.15')), timeout=300)
            node.run(f'if [ ! -f {shlex.quote(marker)} ]; then docker stop etcd >/dev/null 2>&1 || true; docker rm etcd >/dev/null 2>&1 || true; '
                     f'if [ -d /var/lib/etcd ]; then mv /var/lib/etcd /var/lib/etcd.pre-{generation}; fi; mkdir -p /etc/mesh-etcd /var/lib/etcd; touch {shlex.quote(marker)}; fi', timeout=60)
            for filename, value in [('ca.crt', ca), ('server.crt', certificate), ('server.key', key)]:
                node.put('/etc/mesh-etcd/tls/' + filename, value, '600')
            args = ['docker','run','-d','--name','etcd','--restart','always','--net','host','-v','/var/lib/etcd:/etcd-data',
                    '-v','/etc/mesh-etcd/tls:/etcd-tls:ro',mesh.get('etcd_image','quay.io/coreos/etcd:v3.5.15'),'etcd',
                    '--name='+record['name'],'--data-dir=/etcd-data','--initial-cluster-state=new','--initial-cluster='+cluster,
                    '--initial-cluster-token=mesh-'+generation,'--listen-client-urls='+record['client_url']+',https://127.0.0.1:2389',
                    '--advertise-client-urls='+record['client_url'],'--listen-peer-urls='+record['peer_url'],
                    '--initial-advertise-peer-urls='+record['peer_url'],'--cert-file=/etcd-tls/server.crt','--key-file=/etcd-tls/server.key',
                    '--trusted-ca-file=/etcd-tls/ca.crt','--client-cert-auth=true','--peer-cert-file=/etcd-tls/server.crt',
                    '--peer-key-file=/etcd-tls/server.key','--peer-trusted-ca-file=/etcd-tls/ca.crt','--peer-client-cert-auth=true']
            node.run('if docker inspect etcd >/dev/null 2>&1; then docker start etcd >/dev/null; else '+shlex.join(args)+'; fi', timeout=60)
        # Publish only after all selected members are healthy, while agents still forward independently.
        previous = self.control.get('etcd')
        self.control['etcd'] = {'members': records}
        deadline = time.monotonic() + 90
        while True:
            try:
                self._health(records); break
            except Exception:
                if time.monotonic() >= deadline:
                    self.control['etcd'] = previous or {}
                    raise RuntimeError('new etcd cluster is not healthy; mesh remains in standalone mode, retry is safe')
                time.sleep(2)
        values = self.plane_store.snapshot()
        self.etcd_live_rpc('/kv/deleterange', {'key': encoded(PREFIX), 'range_end': encoded(END)})
        for key, value in values.items():
            if not key.startswith(('/mesh/obs/', '/mesh/route/', '/mesh/control/')):
                self.etcd_live_rpc('/kv/put', {'key': encoded(key), 'value': encoded(json.dumps(value))})
        self.etcd_live_rpc('/kv/put', {'key': encoded('/mesh/control/etcd'), 'value': encoded(json.dumps({'members': records}))})
        self._seed_cache({'members': records})
        endpoints = [record['client_url'] for record in records]
        for name in self.mesh['nodes']:
            node = Node(name, self._node_spec(name), self.ssh)
            previous_config = json.loads(node.run('cat /etc/meshagent/config.json', timeout=12))
            self.install_agent(node, name, self.mesh['nodes'][name]['overlay'], self.mesh['nodes'], endpoints,
                               key_file=previous_config.get('key_file', '/etc/wireguard/wgmesh.key'))
        self.save_plane(mode='etcd', desired_members=records, paused_members=[], resume_generation=None)
        self.control['operation'] = {'name': 'mesh', 'kind': 'add', 'stage': 'done'}
        self.step(job, 'etcd healthy; latest local inventory/settings restored and agents reconnected')

    def start_teardown(self):
        if getattr(self, 'ip_updates', {}):
            raise ValueError('complete pending IP updates before removing the mesh')
        if self.plane_store is None:
            raise ValueError('persistent controller state is required')
        if not self.node_operation_lock.acquire(blocking=False):
            raise ValueError('another mesh node operation is in progress')
        if self.etcd_running:
            self.node_operation_lock.release()
            raise ValueError('wait for the current etcd operation')
        job = self.new_job('teardown', 'remove the entire mesh')
        threading.Thread(target=self._teardown_worker, args=(job,), daemon=True).start()
        return job

    def _teardown_worker(self, job):
        from .provision import Node
        try:
            targets = self.plane_state.get('cleanup_targets')
            if targets is None:
                targets = self.all_node_specs()
            for name, relay in list(self.relay_state.items()):
                if relay.get('on') or relay.get('operation'):
                    self.set_relay(name, False, reason='mesh teardown')
            if not self.standalone():
                members = self.etcd_live_rpc('/cluster/member/list', {})['members']
                self.pause_etcd(None, members, job, desired=[])
            self.save_plane(mode='tearing_down', cleanup_targets=targets)
            failures = []
            for name, spec in targets.items():
                try:
                    node = Node(name, spec, self.ssh)
                    cleanup_node(node, spec)
                    self.step(job, name + ': mesh agent/interfaces removed; etcd stopped, data retained')
                    targets = {key: value for key, value in targets.items() if key != name}
                    self.save_plane(cleanup_targets=targets)
                except Exception:
                    failures.append(name)
            if failures:
                raise RuntimeError('cleanup requires retry on: ' + ', '.join(failures))
            self.plane_store.seed({})
            self.save_plane(mode='removed', desired_members=[], cleanup_targets={}, paused_members=[], node_cleanup={})
            self.flags = {}; self.state = {}; self.base_cfg['entries'] = {}; self.base_cfg['exits'] = {}
            self.load_standalone(collect=False)
            job['status'] = 'done'
        except Exception as error:
            job['status'] = 'failed'; job['error'] = str(error)
        finally:
            self.node_operation_lock.release()
            self.wake.set()

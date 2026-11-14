"""Rolling migration of the existing three-member etcd, preserving its data and quorum.

Run inside the controller with its SSH identity and a mounted CA Secret:
    python -m meshctl.mtls plan|stage|agents|peers|finalize|verify
Each command is repeatable. No private key is printed or placed in a command argument.
"""
import copy
import json
import os
from pathlib import Path
import shlex
import time
import sys

import yaml

from .app import Mesh, Ssh
from .pki import issue
from .provision import Node
from .transport import curl_etcd

CLIENT_PORT = 2389
PEER_PORT = 2381
TLS = {'ca_file': '/etc/meshagent/tls/ca.crt', 'cert_file': '/etc/meshagent/tls/client.crt',
       'key_file': '/etc/meshagent/tls/client.key'}
BACKUP = '/root/mesh-mtls-20261031'


def rewrite_flags(argv, updates):
    out, i = [], 0
    while i < len(argv):
        arg = argv[i]
        if arg.split('=', 1)[0] in updates:
            if '=' not in arg and i + 1 < len(argv) and not argv[i + 1].startswith('--'):
                i += 1
        else:
            out.append(arg)
        i += 1
    return out + [k + '=' + str(v) for k, v in updates.items()]


class Migration:
    def __init__(self, cfg, ssh):
        self.cfg, self.ssh = cfg, ssh
        self.mesh = Mesh(cfg, ssh, None)
        self.mesh.read_mesh()
        if not self.mesh.mesh['etcd_up']:
            raise RuntimeError('cannot read the existing mesh; no changes were made')
        self.registry = self.mesh.mesh['nodes']
        self.members = self.mesh.members()
        if len(self.members) < 3:
            raise RuntimeError('this rolling migration requires at least three existing members')
        self.nodes = {}
        for name, record in self.registry.items():
            if name in cfg['entries']:
                d = dict(cfg['entries'][name])
            elif name in cfg['exits']:
                e = cfg['exits'][name]
                d = {'host': e['public_ip'], 'user': e.get('user', 'root'), 'sudo': e.get('user', 'root') != 'root'}
            elif name in self.mesh.inventory:
                d = dict(self.mesh.inventory[name])
            else:
                raise RuntimeError(f'no SSH identity configured for mesh node {name}')
            self.nodes[name] = Node(name, d, ssh)
        self.target = copy.deepcopy(cfg)
        self.target['mesh'].update(etcd_local_url=f'https://127.0.0.1:{CLIENT_PORT}', etcd_tls=TLS,
                                   etcd_endpoints=[self.endpoint(m['name']) for m in self.members])
        self.ca = Path(cfg['mesh'].get('pki', {}).get('ca_file', '/etcd-tls/ca.crt')).read_text()
        self.ca_key = Path(cfg['mesh'].get('pki', {}).get('ca_key_file', '/etcd-tls/ca.key')).read_text()

    def endpoint(self, name):
        return f"https://{self.registry[name]['overlay']}:{CLIENT_PORT}"

    def rpc(self, path, body, secure=True):
        cfg = self.target if secure else {'mesh': {}}
        curl, base = curl_etcd(cfg, timeout=8)
        last = None
        for m in self.members:
            try:
                raw = self.nodes[m['name']].run(f'{curl} -X POST {base}/v3{path} -d @-', stdin=json.dumps(body), timeout=20)
                return json.loads(raw)
            except Exception as e:
                last = e
        raise RuntimeError(f'etcd RPC failed: {last}')

    def all_healthy(self, secure=True):
        via = self.nodes[self.members[0]['name']]
        for m in self.members:
            ep = self.endpoint(m['name']) if secure else f"http://{self.registry[m['name']]['overlay']}:2379"
            curl, _ = curl_etcd(self.target if secure else {}, ep, 4)
            try:
                if json.loads(via.run(f'{curl} {ep}/health', timeout=12)).get('health') not in (True, 'true'):
                    return False
            except Exception:
                return False
        return True

    def wait_all(self, secure=True, timeout=120):
        until = time.monotonic() + timeout
        while time.monotonic() < until:
            if self.all_healthy(secure):
                return
            time.sleep(3)
        raise RuntimeError('not all voting members are healthy; stop before the next member')

    def inspect(self, node):
        script = "import subprocess,json; d=json.loads(subprocess.check_output(['docker','inspect','etcd']))[0]; print(json.dumps({'image':d['Config']['Image'],'cmd':d['Config']['Cmd'],'mounts':[{'source':m['Source'],'destination':m['Destination'],'rw':m['RW']} for m in d['Mounts']]}))"
        return json.loads(node.run('python3 -c ' + shlex.quote(script)))

    def certificates(self, node, server=False):
        cert, key = issue(self.ca, self.ca_key, 'mesh-agent-' + node.name)
        for path, content in [(TLS['ca_file'], self.ca), (TLS['cert_file'], cert), (TLS['key_file'], key)]:
            node.put(path, content, '600')
        if server:
            cert, key = issue(self.ca, self.ca_key, 'mesh-member-' + node.name,
                              [self.registry[node.name]['overlay'], node.d['host'], '127.0.0.1', 'localhost', node.name], server=True)
            for name, content in [('ca.crt', self.ca), ('server.crt', cert), ('server.key', key)]:
                node.put('/etc/mesh-etcd/tls/' + name, content, '600')

    def command(self, config):
        argv = ['docker', 'run', '-d', '--name', 'etcd', '--restart', 'always', '--net', 'host']
        mounts = [m for m in config['mounts'] if m['destination'] != '/etcd-tls']
        for m in mounts:
            argv += ['-v', m['source'] + ':' + m['destination'] + ('' if m['rw'] else ':ro')]
        argv += ['-v', '/etc/mesh-etcd/tls:/etcd-tls:ro', config['image']] + config['cmd']
        return 'docker rm -f etcd >/dev/null && ' + shlex.join(argv)

    def replacement(self, name, previous, phase):
        ov = self.registry[name]['overlay']
        peer = f'https://{ov}:{PEER_PORT}'
        clients = f'https://{ov}:{CLIENT_PORT},https://127.0.0.1:{CLIENT_PORT}'
        peers = peer
        if phase != 'final':
            clients += f',http://{ov}:2379,http://127.0.0.1:2379'
            peers += f',http://{ov}:2380'
        membership = self.rpc('/cluster/member/list', {}, secure=phase != 'stage')['members']
        cluster = ','.join(m['name'] + '=' + m['peerURLs'][0] for m in membership)
        updates = {'--listen-peer-urls': peers, '--listen-client-urls': clients,
                   '--advertise-client-urls': self.endpoint(name),
                   '--initial-advertise-peer-urls': f'http://{ov}:2380' if phase == 'stage' else peer,
                   '--initial-cluster': cluster, '--initial-cluster-state': 'existing',
                   '--cert-file': '/etcd-tls/server.crt', '--key-file': '/etcd-tls/server.key',
                   '--trusted-ca-file': '/etcd-tls/ca.crt', '--client-cert-auth': 'true',
                   '--peer-cert-file': '/etcd-tls/server.crt', '--peer-key-file': '/etcd-tls/server.key',
                   '--peer-trusted-ca-file': '/etcd-tls/ca.crt', '--peer-client-cert-auth': 'true',
                   '--tls-min-version': 'TLS1.2'}
        return dict(previous, cmd=rewrite_flags(previous['cmd'], updates))

    def replace(self, name, phase):
        self.wait_all(secure=phase != 'stage')
        node = self.nodes[name]
        previous = self.inspect(node)
        print(name, phase, "restarting one member", flush=True)
        replacement = self.replacement(name, previous, phase)
        try:
            node.run(self.command(replacement), timeout=60)
            self.wait_all(secure=phase != 'stage')
            curl, base = curl_etcd(self.target)
            health = json.loads(node.run(f'{curl} {base}/health', timeout=15))
            if health.get('health') not in (True, 'true'):
                raise RuntimeError('new mTLS listener is not healthy')
        except Exception:
            node.run(self.command(previous), timeout=60)
            raise RuntimeError(f'{name}: previous container configuration restored; migration stopped')
        print(name, phase, 'healthy', flush=True)

    def stage(self):
        self.wait_all(secure=False)
        for m in self.members:
            node = self.nodes[m['name']]
            original = self.inspect(node)
            data = json.dumps(original)
            node.run(f'umask 077; mkdir -p {BACKUP}; cat > {BACKUP}/container.tmp; '
                     f'if test -s {BACKUP}/container.json; then rm {BACKUP}/container.tmp; '
                     f'else mv {BACKUP}/container.tmp {BACKUP}/container.json; fi', stdin=data)
            node.run('mkdir -p /var/lib/etcd/mesh-backups; test -s /var/lib/etcd/mesh-backups/pre-mtls.snapshot || '
                     'docker exec -e ETCDCTL_API=3 etcd etcdctl --endpoints=http://127.0.0.1:2379 snapshot save /etcd-data/mesh-backups/pre-mtls.snapshot', timeout=60)
            self.certificates(node, server=True)
            self.replace(node.name, 'stage')
        self.wait_all()
        print('all three authenticated TLS listeners are healthy; HTTP is still available during migration', flush=True)

    def agents(self):
        self.wait_all()
        self.mesh.cfg = self.target
        for name, node in self.nodes.items():
            current = json.loads(node.run('cat /etc/meshagent/config.json'))
            key_file = current.get('key_file')
            if not isinstance(key_file, str) or not key_file.startswith('/'):
                raise ValueError('existing agent has no valid WireGuard key path; refusing to replace it')
            self.mesh.install_agent(node, name, self.registry[name]['overlay'], self.registry, self.target['mesh']['etcd_endpoints'], key_file=key_file)
            print(name, 'agent upgraded to mTLS and quality routing', flush=True)
        self.verify_agents()

    def verify_agents(self):
        until = time.monotonic() + 120
        while time.monotonic() < until:
            result = self.rpc('/kv/range', {'key': 'L21lc2gvb2JzLw==', 'range_end': 'L21lc2gvb2JzMA=='})
            import base64
            live = {base64.b64decode(v['key']).decode().rsplit('/', 1)[1]: json.loads(base64.b64decode(v['value'])) for v in result.get('kvs', [])}
            ready = all(time.time() - live.get(n, {}).get('ts', 0) < 30 and 'load' in live.get(n, {}) for n in self.nodes)
            if ready:
                for node in self.nodes.values():
                    raw = node.run('cat /etc/meshagent/config.json')
                    cfg = json.loads(raw)
                    if cfg.get('etcd_tls') != TLS or cfg.get('etcd') != self.target['mesh']['etcd_endpoints']:
                        raise RuntimeError('an agent has not switched to authenticated endpoints')
                return
            time.sleep(5)
        raise RuntimeError('not all upgraded agents are publishing fresh observations; HTTP must remain enabled')

    def peers(self):
        self.wait_all()
        self.verify_agents()
        for m in self.members:
            member = next(x for x in self.rpc('/cluster/member/list', {})['members'] if x['name'] == m['name'])
            ep = f"https://{self.registry[m['name']]['overlay']}:{PEER_PORT}"
            self.rpc('/cluster/member/update', {'ID': member['ID'], 'peerURLs': [ep]})
            self.replace(m['name'], 'peers')

    def finalize(self):
        self.wait_all()
        self.verify_agents()
        members = self.rpc('/cluster/member/list', {})['members']
        if any(not all(p.startswith('https://') for p in m['peerURLs']) for m in members):
            raise RuntimeError('peer migration is incomplete; refusing to remove HTTP')
        if not self.cfg['mesh'].get('etcd_tls'):
            raise RuntimeError('deploy the mTLS controller GitOps configuration before removing HTTP')
        for m in self.members:
            self.replace(m['name'], 'final')
        self.verify()

    def renew(self):
        """Renew leaf certificates under the same CA, one member at a time."""
        if not self.cfg['mesh'].get('etcd_tls'):
            raise RuntimeError('complete the mTLS migration before renewing certificates')
        self.verify()
        self.agents()
        for m in self.members:
            self.certificates(self.nodes[m['name']], server=True)
            self.replace(m['name'], 'final')
        self.verify()

    def verify(self):
        self.wait_all()
        self.verify_agents()
        for m in self.members:
            node = self.nodes[m['name']]
            cmd = self.inspect(node)['cmd']
            if any('http://' in arg for arg in cmd):
                raise RuntimeError('an unauthenticated HTTP endpoint remains in etcd container arguments')
            _, endpoint = curl_etcd(self.target)
            # Trusted server CA alone must be insufficient without the client certificate.
            check = node.run(f"curl -s --cacert {shlex.quote(TLS['ca_file'])} -m 4 {endpoint}/health >/dev/null 2>&1; echo $?").strip()
            if check == '0':
                raise RuntimeError('client certificate was not required')
        print('verified: 3/3 healthy, peers HTTPS, agents authenticated, HTTP removed, anonymous TLS rejected', flush=True)


def main():
    cfg = yaml.safe_load(Path(os.environ.get('MESHCTL_CONFIG', '/config/config.yaml')).read_text())
    migration = Migration(cfg, Ssh(os.environ.get('MESHCTL_KEY', '/secrets/id_ed25519'), cfg.get('ssh_jumps')))
    action = sys.argv[1] if len(sys.argv) > 1 else 'plan'
    if action == 'plan':
        print(json.dumps({'members': [m['name'] for m in migration.members], 'agents': sorted(migration.nodes),
                          'authenticated_endpoints': migration.target['mesh']['etcd_endpoints']}))
    elif action in ('stage', 'agents', 'peers', 'finalize', 'verify', 'renew'):
        getattr(migration, action)()
    else:
        raise ValueError('use plan, stage, agents, peers, finalize, verify, or renew')


if __name__ == '__main__':
    main()

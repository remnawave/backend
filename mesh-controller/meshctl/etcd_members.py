"""Learner-first membership changes and durable discovery of the etcd control plane."""
import copy
import json
import os
from pathlib import Path
import shlex
import threading
import time

from .pki import issue
from .transport import curl_etcd

TLS = {'ca_file': '/etc/meshagent/tls/ca.crt', 'cert_file': '/etc/meshagent/tls/client.crt',
       'key_file': '/etc/meshagent/tls/client.key'}
IMAGE = 'quay.io/coreos/etcd:v3.5.15'


def check_removal(members, target, minimum=3):
    remaining = [m for m in members if m['ID'] != target['ID']]
    if not target.get('isLearner') and sum(not m.get('isLearner') for m in remaining) < minimum:
        raise ValueError('add a replacement first: at least three voting members must remain after removal')
    return remaining


class EtcdMembers:
    def init_etcd_control(self):
        self.etcd_lock = threading.RLock()
        self.etcd_running = False
        self.control_generation = 0
        self.control = {}
        directory = os.environ.get('MESHCTL_STATE_DIR')
        self.seed_path = Path(directory) / 'etcd-seeds.json' if directory else None
        if self.seed_path and self.seed_path.exists():
            saved = json.loads(self.seed_path.read_text())
            if saved.get('members'):
                self.control['etcd'] = saved

    def _seed_cache(self, record):
        if not self.seed_path:
            return
        self.seed_path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        temp = self.seed_path.with_suffix('.tmp')
        with open(temp, 'w', opener=lambda path, flags: os.open(path, flags, 0o600)) as f:
            json.dump(record, f);f.flush();os.fsync(f.fileno())
        os.replace(temp, self.seed_path)
        fd = os.open(str(self.seed_path.parent), os.O_RDONLY)
        try: os.fsync(fd)
        finally: os.close(fd)

    def _node_spec(self, name):
        if name in self.cfg['entries']:
            return dict(self.cfg['entries'][name])
        if name in self.inventory:
            d = dict(self.inventory[name]);d['host'] = (self.ipmap.get(name) or {}).get('ip') or d['host'];return d
        if name in self.cfg['exits']:
            x = self.cfg['exits'][name]
            return {'host': x['public_ip'], 'user': x.get('user','root'), 'sudo': x.get('user','root') != 'root'}
        raise ValueError('unknown mesh node')

    def _member_records(self, members):
        out = []
        for m in members:
            if m.get('isLearner') or not m.get('name'):
                continue
            name = m['name']
            if name not in self.mesh['nodes']:
                raise RuntimeError('an etcd member is not registered in the mesh')
            d = self._node_spec(name)
            out.append({'name':name,'host':d['host'],'user':d.get('user','root'),'sudo':bool(d.get('sudo')),
                        'overlay':self.mesh['nodes'][name]['overlay'],'client_url':m['clientURLs'][0],
                        'peer_url':m['peerURLs'][0]})
        if not out:
            raise RuntimeError('no voting etcd members discovered')
        return sorted(out,key=lambda m:m['name'])

    def _save_etcd_members(self, records):
        record = {'members': records}
        # This must be durable before removing a bootstrap member.
        self._seed_cache(record)
        self.control['etcd'] = record
        self.control_generation += 1
        self.etcd_put('/mesh/control/etcd', record)

    def refresh_etcd_control(self):
        if getattr(self, 'standalone', lambda: False)():
            return
        if not (self.cfg.get('mesh') or {}).get('etcd_tls') or self.etcd_running:
            return
        records = self._member_records(self.etcd_rpc('/cluster/member/list', {})['members'])
        if records != (self.control.get('etcd') or {}).get('members'):
            self._save_etcd_members(records)
        else:
            self._seed_cache({'members':records})

    def start_etcd_change(self, name, member, resume=False):
        if not isinstance(member,bool) or name not in self.mesh['nodes']:
            raise ValueError('known mesh node and boolean member are required')
        if not (self.cfg.get('mesh') or {}).get('etcd_tls'):
            raise ValueError('complete the etcd mTLS migration first')
        if self.seed_path is None:
            raise ValueError('membership changes require persistent controller state')
        if getattr(self, 'node_operation_lock', None) and self.node_operation_lock.locked():
            raise ValueError('wait for the current mesh node operation')
        if getattr(self, 'plane_state', {}).get('mode', 'etcd') not in ('etcd', 'standalone', 'pausing'):
            raise ValueError('complete the current control-plane operation first')
        with self.etcd_lock:
            if self.etcd_running:
                raise ValueError('wait for the current etcd membership change')
            pending = self.control.get('operation') or {}
            if (pending.get('stage') not in (None,'done') or pending.get('cleanup_pending')) and (pending.get('name')!=name or pending.get('kind')!=('add' if member else 'remove')):
                raise ValueError('complete the pending etcd change first')
            self.etcd_running = True
        job = self.new_job('etcd', ('Add ' if member else 'Remove ') + name + ' in etcd')
        threading.Thread(target=self._etcd_worker,args=(job,name,member),daemon=True).start()
        return job

    def resume_etcd_change(self):
        op = self.control.get('operation') or {}
        if (op.get('stage') not in (None,'done') or op.get('cleanup_pending')) and not self.etcd_running:
            self.start_etcd_change(op['name'],op['kind']=='add',resume=True)

    def _operation(self, op, stage, **extra):
        op = dict(op,stage=stage,**extra)
        self.etcd_put('/mesh/control/operation',op)
        self.control['operation'] = op
        self.control_generation += 1
        return op

    def _health(self, records, require_all=True):
        alive = []
        for record in records:
            curl, ep = curl_etcd(self.cfg,record['client_url'],4)
            d = self._node_spec(record['name'])
            try:
                code,out,_ = self.ssh.run(d['host'],d.get('user','root'),f'{"sudo -n " if d.get("sudo") else ""}bash -c {shlex.quote(curl+" "+ep+"/health")}',timeout=12)
                if code == 0 and json.loads(out).get('health') in (True,'true'):
                    alive.append(record['name'])
            except Exception:
                pass
        required = len(records) if require_all else len(records)//2+1
        if len(alive) < required:
            raise RuntimeError('insufficient healthy members for a safe quorum change')
        return alive

    def _etcd_worker(self,job,name,member):
        try:
            with self.etcd_lock:
                self.change_etcd(name,member,job)
                job['status']='done'
        except Exception as e:
            job['status']='failed';job['error']=str(e)
            pending=self.control.get('operation') or {}
            if pending.get('stage') not in (None,'done'):
                try:self._operation(pending,pending['stage'],error=str(e))
                except Exception:pass
            self.event(f'etcd {name}: {e}','etcd',name)
        finally:
            self.etcd_running=False
            self.wake.set()

    def change_etcd(self,name,member,job):
        from .provision import Node
        if getattr(self, 'plane_store', None) is not None and self.standalone():
            return self.change_standalone_member(name, member, job)
        pending = self.control.get('operation') or {}
        if (pending.get('stage') not in (None, 'done') or pending.get('cleanup_pending')) and (
                pending.get('name') != name or pending.get('kind') != ('add' if member else 'remove')):
            raise ValueError('complete the pending etcd change first')
        d=self._node_spec(name);node=Node(name,d,self.ssh)
        overlay=self.mesh['nodes'][name]['overlay'];peer=f'https://{overlay}:2381'
        members=self.etcd_rpc('/cluster/member/list',{})['members']
        target=next((m for m in members if m.get('name')==name or peer in m.get('peerURLs',[])),None)
        records=self._member_records(members)
        if not member and target and not target.get('isLearner') and sum(not row.get('isLearner') for row in members if row['ID'] != target['ID']) < 3 and getattr(self, 'plane_store', None) is not None:
            self._health(records, require_all=False)
            return self.pause_etcd(name, members, job)
        if member: self._health(records, require_all=False)
        op=self.control.get('operation') or {}
        if (op.get('stage')=='done' and not op.get('cleanup_pending')) or op.get('name')!=name:op={}
        if member:
            if target and not target.get('isLearner'):
                self._save_etcd_members(records)
                self._operation({'name':name,'kind':'add'},'done')
                self.step(job,'Node is already a voting member');return
            if any(m.get('isLearner') and m is not target for m in members):
                raise ValueError('another learner exists; complete its promotion first')
            if len(members)>=7 and not target:
                raise ValueError('at most seven etcd members are supported')
            if not op:
                self.step(job,'Checking Docker and preparing the image')
                node.run('command -v docker >/dev/null || (DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io >/dev/null)',timeout=600)
                existing=node.run('docker inspect etcd >/dev/null 2>&1; echo $?').strip()=='0'
                if existing:raise ValueError('etcd already exists on the server; automatic overwrite is forbidden')
                if node.run('test -d /var/lib/etcd/member; echo $?').strip()=='0':
                    marker=json.loads(node.run('cat /etc/mesh-etcd/managed.json'))
                    if not marker.get('retired'):raise ValueError('existing etcd data is not marked as retired')
                    node.run('mv /var/lib/etcd /var/lib/etcd.retired-'+str(int(time.time())))
                node.run('docker pull '+shlex.quote((self.cfg.get('mesh') or {}).get('etcd_image',IMAGE)),timeout=300)
                pki=self.cfg['mesh'].get('pki') or {}
                ca=Path(pki.get('ca_file','/etcd-tls/ca.crt')).read_text();key=Path(pki.get('ca_key_file','/etcd-tls/ca.key')).read_text()
                cert,private=issue(ca,key,'mesh-member-'+name,[overlay,d['host'],'127.0.0.1','localhost',name],server=True)
                for f,v in [('ca.crt',ca),('server.crt',cert),('server.key',private)]:node.put('/etc/mesh-etcd/tls/'+f,v,'600')
                op=self._operation({'name':name,'kind':'add','peer':peer},'prepared')
            if not target:
                response=self.etcd_rpc('/cluster/member/add',{'peerURLs':[peer],'isLearner':True})
                target=response['member'];members=response['members']
            op=self._operation(op,'joining',member_id=target['ID'])
            self.step(job,'Learner added without changing quorum; starting and synchronizing data')
            marker={'member_id':target['ID'],'retired':False}
            node.put('/etc/mesh-etcd/managed.json',json.dumps(marker),'600')
            cluster=','.join((m.get('name') or name)+'='+m['peerURLs'][0] for m in members)
            args=['docker','run','-d','--name','etcd','--restart','always','--net','host','-v','/var/lib/etcd:/etcd-data','-v','/etc/mesh-etcd/tls:/etcd-tls:ro',self.cfg['mesh'].get('etcd_image',IMAGE),'etcd',
                  '--name='+name,'--data-dir=/etcd-data','--initial-cluster-state=existing','--initial-cluster='+cluster,
                  '--listen-client-urls=https://'+overlay+':2389,https://127.0.0.1:2389','--advertise-client-urls=https://'+overlay+':2389',
                  '--listen-peer-urls='+peer,'--initial-advertise-peer-urls='+peer,'--cert-file=/etcd-tls/server.crt','--key-file=/etcd-tls/server.key','--trusted-ca-file=/etcd-tls/ca.crt','--client-cert-auth=true',
                  '--peer-cert-file=/etcd-tls/server.crt','--peer-key-file=/etcd-tls/server.key','--peer-trusted-ca-file=/etcd-tls/ca.crt','--peer-client-cert-auth=true','--auto-compaction-retention=1','--quota-backend-bytes=268435456']
            # Repeating a failed job keeps the existing learner's data and container.
            node.run('mkdir -p /var/lib/etcd; if docker inspect etcd >/dev/null 2>&1; then docker start etcd; else '+shlex.join(args)+'; fi',timeout=60)
            deadline=time.monotonic()+180
            while True:
                try:
                    self.etcd_rpc('/cluster/member/promote',{'ID':target['ID']});break
                except Exception:
                    if time.monotonic()>deadline:raise RuntimeError('learner is still catching up; operation saved for resumption')
                    time.sleep(3)
            self.step(job,'Data synchronized; etcd approved promotion to voting member')
        else:
            if not target and not op:
                self.step(job,"Node is no longer an etcd member");return
            if target:
                remaining=check_removal(members,target)
                future=self._member_records(remaining);self._health(future)
                op=self._operation({'name':name,'kind':'remove','member_id':target['ID']},'prepared')
                self._save_etcd_members(future)
                self.etcd_rpc('/cluster/member/remove',{'ID':target['ID']})
            else:
                op=self._operation({'name':name,'kind':'remove'},'cleanup')
            self.step(job,'Member removed from quorum; stopping etcd while preserving data')
            try:
                node.put('/etc/mesh-etcd/managed.json',json.dumps({'retired':True}),'600')
                node.run('docker rm -f etcd >/dev/null 2>&1 || true')
                op['cleanup_pending']=False
            except Exception:
                op['cleanup_pending']=True
                self.step(job,'Membership changed; server unreachable for Docker shutdown. Data preserved; cleanup will be retried.')
        current=self.etcd_rpc('/cluster/member/list',{})['members']
        self._save_etcd_members(self._member_records(current))
        self._operation(op or {'name':name,'kind':'add' if member else 'remove'},
                        'cleanup' if op.get('cleanup_pending') else 'done',error=None)
        self.event(f'etcd: {name} '+('added as a voting member' if member else 'removed; data preserved'),'etcd',name)

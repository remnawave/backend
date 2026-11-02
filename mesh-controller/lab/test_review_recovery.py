#!/usr/bin/env python3
"""Managed review regressions; run after test_empty_mesh.py on the disposable lab."""
import json
import subprocess
import time
from prepare_managed import ALL, LAB_PASSWORD, node, run
from test_control_plane import api, job, wait, stopped


def controller_python(code):
    result=subprocess.run(ALL+['exec','-T','controller','python','-'],input=code,capture_output=True,text=True,timeout=90)
    if result.returncode: raise RuntimeError(result.stderr[-1000:])
    return result.stdout.strip()


def start_job(path, body):
    identifier=api(path,body)['job']
    wait('operation '+path,lambda:api('/api/jobs/'+identifier)['status']!='running',timeout=240)
    return api('/api/jobs/'+identifier)


def main():
    wait('managed three-voter mesh is healthy',lambda:api('/status')['quorum']['healthy']==3)
    fingerprint=node('spare','ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256').split()[1]
    job('/api/nodes',{'name':'spare','host':'172.30.88.14','user':'root','role':'entry','password':LAB_PASSWORD,'host_key_fingerprint':fingerprint})
    # A removed entry must not leave forwarding services or firewall rules behind.
    overlay=api('/status')['inventory']['spare']['overlay']
    exit_overlay=api('/status')['overlay']['nodes']['exit']['overlay']
    rules={'source_ip':overlay,'rules':[{'id':'exit','target':exit_overlay,'maps':[['tcp',45000,8443]]}]}
    node('spare',"mkdir -p /etc/meshfwd; cat > /etc/meshfwd/rules.json <<'EOF'\n"+json.dumps(rules)+"\nEOF\npython /app/agent/meshfwd.py apply")
    paused=False
    try:
        run('pause','spare');paused=True
        result=start_job('/api/nodes/remove',{'name':'spare'})
        assert result['status']=='failed', 'offline cleanup must not claim success'
        run('restart','controller')
        wait('offline removal remains visible after controller restart',lambda:'spare' in api('/status')['inventory'])
        retained=controller_python("import json\ns=json.load(open('/state/control-plane.json'))\nassert 'spare' in s['node_cleanup']\nprint('retained')")
        assert retained=='retained'
        run('unpause','spare');paused=False
        job('/api/nodes/remove',{'name':'spare'})
        assert 'spare' not in api('/status')['inventory']
        assert node('spare','test ! -e /etc/meshagent/config.json && test ! -e /etc/meshfwd/rules.json && echo clean')=='clean'
        assert 'MESHFWD' not in node('spare','iptables-save')
        assert 'MESHAGENT' not in node('spare','iptables-save')
        print('PASS: offline entry cleanup survives restart, retries and removes relay/agent firewall state',flush=True)
    finally:
        if paused:run('unpause','spare')
    # Verify address reassociation with the actual SSH daemon and its pinned host key.
    node('entry','ip addr add 172.30.88.15/24 dev eth0')
    try:
        output=controller_python("""from meshctl.app import Ssh
import paramiko
ssh=Ssh('/secrets/id_ed25519')
ssh.verify_host_move('172.30.88.11','172.30.88.15','root')
assert ssh.run('172.30.88.15','root','true')[0]==0
try:ssh.verify_host_move('172.30.88.11','172.30.88.13','root')
except paramiko.SSHException:pass
else:raise AssertionError('different host key was accepted')
print('verified')
""")
        assert output=='verified'
        print('PASS: a real SSH address move preserves trust and rejects another node key',flush=True)
    finally:
        node('entry','ip addr del 172.30.88.15/24 dev eth0')
    # Exercise the real migration installer with an existing non-default WireGuard key path.
    node('entry',"mv /etc/wireguard/wgmesh.key /etc/wireguard/preserved.key; python -c \"import json; p='/etc/meshagent/config.json'; c=json.load(open(p)); c['key_file']='/etc/wireguard/preserved.key'; json.dump(c,open(p,'w'))\"; systemctl restart meshagent")
    output=controller_python("""from meshctl.app import Ssh
from meshctl.mtls import Migration
from pathlib import Path
import yaml,json
cfg=yaml.safe_load(Path('/config/config.yaml').read_text())
migration=Migration(cfg,Ssh('/secrets/id_ed25519'))
before=migration.nodes['entry'].run('wg pubkey < /etc/wireguard/preserved.key')
migration.agents()
current=json.loads(migration.nodes['entry'].run('cat /etc/meshagent/config.json'))
assert current['key_file']=='/etc/wireguard/preserved.key'
assert migration.nodes['entry'].run('wg pubkey < /etc/wireguard/preserved.key')==before
print('key-preserved')
""")
    assert output.endswith('key-preserved')
    print('PASS: real mTLS agent migration preserves an existing WireGuard key path and public key',flush=True)
    # Kill the controller only after it has started a real etcd member while the last node is offline.
    job('/api/etcd',{'name':'exit','member':False})
    paused=False
    try:
        run('pause','transit');paused=True
        api('/api/etcd',{'name':'exit','member':True})
        wait('resume has started etcd before interruption',lambda:api('/status')['control_plane']['mode']=='resuming' and not stopped('entry'))
        run('kill','-s','KILL','controller')
        run('up','-d','controller')
        wait('restart retains a pending stop operation',lambda:api('/status')['control_plane']['mode']=='pausing')
        run('unpause','transit');paused=False
        wait('interrupted resume stops every etcd member before standalone',lambda:api('/status')['control_plane']['mode']=='standalone' and all(stopped(name) for name in ('entry','transit','exit')),timeout=240)
        job('/api/etcd',{'name':'exit','member':True})
        wait('retry after interrupted resume restores three voters and live agents',lambda:api('/status')['quorum']['healthy']==3 and len(api('/status')['overlay']['obs'])==3,timeout=180)
        print('PASS: a real controller crash during resume stops partial etcd state and recovers on retry',flush=True)
    finally:
        if paused:run('unpause','transit')


if __name__=='__main__':main()

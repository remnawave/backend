#!/usr/bin/env python3
"""Managed lab acceptance: pause all etcd, standalone failover, restart, resume, teardown.

Run prepare_managed.py first. Only touches the rw-mesh-lab project.
"""
import json
import subprocess
import time
from prepare_managed import ALL, NODES, node, run


def api(path, body=None):
    code = '''import json,os,urllib.request
path,body=json.loads(input())
req=urllib.request.Request('http://127.0.0.1:8080'+path,data=None if body is None else json.dumps(body).encode(),headers={'X-Mesh-Token':os.environ['MESH_API_TOKEN'],'Content-Type':'application/json'})
print(urllib.request.urlopen(req,timeout=30).read().decode())
'''
    result = subprocess.run(ALL+['exec','-T','controller','python','-c',code], input=json.dumps([path,body]), text=True,capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr[-1200:])
    return json.loads(result.stdout)


def wait(description, predicate, timeout=150):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        try:
            if predicate(): print('PASS: '+description,flush=True);return
        except RuntimeError:
            pass
        time.sleep(2)
    raise AssertionError(description)


def job(path, body):
    identifier=api(path,body)['job']
    wait('operation '+path,lambda:api('/api/jobs/'+identifier)['status']!='running',timeout=240)
    result=api('/api/jobs/'+identifier)
    assert result['status']=='done', result.get('error')


def stopped(name):
    # Check actual Linux processes, not the process adapter's response.
    command="python3 -c \"from pathlib import Path; print(any(p.name.isdigit() and (p/'comm').exists() and (p/'comm').read_text().strip()=='etcd' and (p/'stat').read_text().split()[2]!='Z' for p in Path('/proc').iterdir()))\""
    return node(name,command)=='False'


def main():
    wait('three healthy real etcd voters',lambda:api('/status')['quorum']['healthy']==3)
    # A real TLS target in the exit network namespace, independently of the agent.
    node('exit','umask 077; openssl req -x509 -newkey rsa:2048 -nodes -keyout /tmp/target.key -out /tmp/target.crt -days 1 -subj /CN=mesh-lab >/dev/null 2>&1')
    server="import ssl,http.server; s=http.server.HTTPServer(('0.0.0.0',8443),http.server.SimpleHTTPRequestHandler); c=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); c.load_cert_chain('/tmp/target.crt','/tmp/target.key'); s.socket=c.wrap_socket(s.socket,server_side=True); s.serve_forever()"
    run('exec','-T','-d','exit','python3','-c',server)
    request=lambda: node('entry','curl -skf --connect-timeout 2 --max-time 5 https://10.88.0.3:8443/ >/dev/null && echo OK')=='OK'
    wait('TLS traffic before pause',request)
    job('/api/etcd',{'name':'exit','member':False})
    assert api('/status')['control_plane']['mode']=='standalone'
    wait('all actual etcd processes have exited', lambda: all(stopped(name) for name in NODES), timeout=30)
    assert all(node(name,'test -d /var/lib/etcd/member && echo retained')=='retained' for name in NODES)
    assert request()
    print('PASS: 3 -> 2 stops ALL etcd processes, retains data and TLS forwarding',flush=True)
    api('/api/flags',{'auto_switch':True})
    run('restart','controller')
    wait('controller restart preserves standalone mode and latest flags',lambda:api('/status')['control_plane']['mode']=='standalone' and api('/status')['auto_switch'])
    # Block only the direct entry/exit underlay link. The local journal distributes live graph updates.
    node('entry','iptables -I OUTPUT 1 -d 172.30.88.13 -p udp --dport 52001 -j DROP; iptables -I INPUT 1 -s 172.30.88.13 -p udp --dport 52003 -j DROP')
    try:
        wait('standalone mesh finds a transit route without etcd',lambda:'dev wgm-transit' in node('entry','ip route get 10.88.0.3'))
        assert request()
        print('PASS: TLS traffic through transit while etcd is stopped',flush=True)
    finally:
        node('entry','iptables -D OUTPUT -d 172.30.88.13 -p udp --dport 52001 -j DROP; iptables -D INPUT -s 172.30.88.13 -p udp --dport 52003 -j DROP')
    wait('standalone direct route recovers',lambda:'dev wgm-exit' in node('entry','ip route get 10.88.0.3'))
    job('/api/etcd',{'name':'exit','member':True})
    wait('2 -> 3 resumes three healthy voters',lambda:api('/status')['control_plane']['mode']=='etcd' and api('/status')['quorum']['healthy']==3)
    assert api('/status')['auto_switch'] and request()
    assert all(len(json.loads(node(name, 'cat /etc/meshagent/config.json'))['etcd']) == 3 for name in NODES)
    wait('agents publish fresh observations back to etcd', lambda: len(api('/status')['overlay']['obs']) == 3)
    assert all(node(name,'for directory in /var/lib/etcd.pre-*/member; do if [ -d "$directory" ]; then echo archived; break; fi; done')=='archived' for name in NODES)
    print('PASS: resume restores latest settings and archives previous etcd data',flush=True)
    job('/api/teardown',{'confirm':'REMOVE_MESH'})
    assert api('/status')['control_plane']['mode']=='removed'
    assert not api('/status')['overlay']['nodes']
    wait('all etcd processes exit after teardown', lambda: all(stopped(name) for name in NODES), timeout=30)
    for name in NODES:
        assert stopped(name)
        assert not node(name,'ip -o link show | grep "wgm-" || true')
        assert node(name,'test ! -e /etc/meshagent/config.json && test -d /var/lib/etcd/member && echo clean')=='clean'
    print('PASS: complete mesh removal stops services, removes overlay/config and retains etcd data',flush=True)


if __name__=='__main__':main()

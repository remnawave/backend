#!/usr/bin/env python3
"""Lab-only process manager: execute real etcd/agents without Docker-in-Docker/systemd.

Never installed by the controller or production image. Preserves the actual etcd
flags/TLS/data directories so integration tests exercise real Raft membership.
"""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

root=Path('/run/mesh-lab-services');root.mkdir(exist_ok=True)

def alive(name):
    try:
        pid=int((root/(name+'.pid')).read_text())
        os.kill(pid,0)
        return Path(f'/proc/{pid}/stat').read_text().split()[2] != 'Z'
    except (OSError,ValueError):return False

def stop(name):
    try:
        pid=int((root/(name+'.pid')).read_text())
        os.killpg(pid,signal.SIGTERM)
        deadline=time.monotonic()+10
        while alive(name) and time.monotonic()<deadline:time.sleep(.05)
        if alive(name):
            os.killpg(pid,signal.SIGKILL)
            deadline=time.monotonic()+2
            while alive(name) and time.monotonic()<deadline:time.sleep(.05)
        if alive(name):raise RuntimeError('lab service did not exit: '+name)
    except (OSError,ValueError):pass
    (root/(name+'.pid')).unlink(missing_ok=True)

def start(name,args):
    if alive(name):return
    with open('/tmp/mesh-lab-'+name+'.log','ab') as log:
        process=subprocess.Popen(args,stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True,close_fds=True)
    (root/(name+'.pid')).write_text(str(process.pid))

args=sys.argv[1:]
if Path(sys.argv[0]).name=='systemctl':
    action=args[0];service=next((arg.removesuffix('.service') for arg in args[1:] if not arg.startswith('-')), '')
    if action=='disable' and '--now' in args:stop(service)
    if action in ('daemon-reload','enable','disable'):sys.exit(0)
    if action in ('stop','restart'):stop(service)
    if action in ('start','restart'):
        if action=='restart':
            import time;time.sleep(.2)
        if service=='meshagent':start(service,['python3','/usr/local/lib/meshagent/meshagent.py','/etc/meshagent/config.json'])
        elif service=='meshfwd':subprocess.run(['python3','/usr/local/sbin/meshfwd.py','apply'],check=True)
    sys.exit(0)

if not args:sys.exit(1)
action=args[0]
if action=='pull':
    # The pinned etcd image's real binary is copied into this lab image at build time.
    if args[1]!='quay.io/coreos/etcd:v3.5.15':sys.exit('unexpected lab image')
    sys.exit(0)
if action=='inspect':
    if not (root/'etcd.args').exists():sys.exit(1)
    if '--format' in args:print((root/'etcd.args').read_text())
    else:print(json.dumps([{'State':{'Running':alive('etcd')}}]))
elif action=='run':
    offset=args.index('quay.io/coreos/etcd:v3.5.15') + 1
    command=args[offset:]
    (root/'etcd.args').write_text(json.dumps(command))
    transformed=[]
    for arg in command:
        transformed.append(arg.replace('/etcd-data','/var/lib/etcd').replace('/etcd-tls/','/etc/mesh-etcd/tls/'))
    start('etcd',transformed);print('lab-etcd-process')
elif action=='start':
    command=json.loads((root/'etcd.args').read_text())
    start('etcd',[arg.replace('/etcd-data','/var/lib/etcd').replace('/etcd-tls/','/etc/mesh-etcd/tls/') for arg in command])
elif action=='stop':stop('etcd')
elif action=='rm':
    stop('etcd');(root/'etcd.args').unlink(missing_ok=True)
else:sys.exit('unsupported lab Docker command: '+action)

#!/usr/bin/env python3
"""Real SSH + three-member mTLS etcd lab for UI acceptance tests, no production access."""
import json
import argparse
from pathlib import Path
import secrets
import shutil
import subprocess
import time

from test_lab import BASE, HERE, execute

EXTRA=['-f',str(HERE/'compose.managed.yaml')]
ALL=BASE+['-f',str(HERE/'compose.panel.yaml')]+EXTRA+['-f',str(HERE/'compose.ui.yaml')]
NODES={'entry':('172.30.88.11','10.88.0.1'),'transit':('172.30.88.12','10.88.0.2'),'exit':('172.30.88.13','10.88.0.3')}
# Disposable, loopback-only lab login; never use these values on a public deployment.
LAB_PASSWORD='LocalMeshOnly-Tests2026!Aa1'

def run(*args):
    result=subprocess.run(ALL+list(args),capture_output=True,text=True)
    if result.returncode:raise RuntimeError(result.stderr[-2000:])
    return result.stdout.strip()

def node(name,command):return run('exec','-T',name,'sh','-c',command)

def main(frontend_dist):
    state=HERE/'state';state.mkdir(exist_ok=True)
    # The project name exclusively owns these disposable containers and volumes.
    if not (state/'panel.env').exists():(state/'panel.env').write_text('')
    run('down','-v','--remove-orphans')
    run('up','-d','entry','transit','exit','spare')
    pki_code="""from pathlib import Path
import os
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
from meshctl.pki import create_ca,issue
root=Path('/state');pki=root/'pki';pki.mkdir(exist_ok=True)
ca,key=create_ca();(pki/'ca.crt').write_text(ca);(pki/'ca.key').write_text(key)
client,private=issue(ca,key,'mesh-lab-controller');(pki/'client.crt').write_text(client);(pki/'client.key').write_text(private)
k=Ed25519PrivateKey.generate();(root/'controller-key').write_bytes(k.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.OpenSSH,serialization.NoEncryption()))
(root/'controller.pub').write_bytes(k.public_key().public_bytes(serialization.Encoding.OpenSSH,serialization.PublicFormat.OpenSSH)+bytes([10]))
for name,ip,overlay in [('entry','172.30.88.11','10.88.0.1'),('transit','172.30.88.12','10.88.0.2'),('exit','172.30.88.13','10.88.0.3')]:
 cert,private=issue(ca,key,'member-'+name,[ip,overlay,'127.0.0.1','localhost',name],server=True)
 (pki/(name+'.crt')).write_text(cert);(pki/(name+'.key')).write_text(private)
for path in pki.iterdir():path.chmod(0o600);os.chown(path,10001,10001)
(root/'controller-key').chmod(0o600);os.chown(root/'controller-key',10001,10001)
(root/'controller').mkdir(exist_ok=True);os.chown(root/'controller',10001,10001)
"""
    process=subprocess.run(ALL+['exec','-T','entry','python','-'],input=pki_code,capture_output=True,text=True)
    if process.returncode:raise RuntimeError(process.stderr[-1000:])
    known=[];seeds={};fingerprint=None
    for index,name in enumerate(['entry','transit','exit','spare'],1):
        node(name,"mkdir -p /run/sshd /root/.ssh /etc/wireguard /etc/meshagent/tls /etc/mesh-etcd/tls /var/lib/etcd; chmod 700 /root/.ssh; cp /state/controller.pub /root/.ssh/authorized_keys; chmod 600 /root/.ssh/authorized_keys; ssh-keygen -A >/dev/null 2>&1; printf '\nPermitRootLogin yes\nPasswordAuthentication yes\n' >> /etc/ssh/sshd_config; /usr/sbin/sshd")
        # Set only this disposable container's password, via stdin (not process arguments).
        result=subprocess.run(ALL+['exec','-T',name,'chpasswd'],input='root:'+LAB_PASSWORD+'\n',capture_output=True,text=True)
        if result.returncode:raise RuntimeError('lab password setup failed')
        hostkey=node(name,'cat /etc/ssh/ssh_host_ed25519_key.pub').split()
        if name=='spare':
            fingerprint=node(name,'ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256').split()[1]
            continue
        ip,overlay=NODES[name];known.append(ip+' '+' '.join(hostkey[:2]))
        public=node(name,'umask 077; wg genkey > /etc/wireguard/lab.key; wg pubkey < /etc/wireguard/lab.key')
        seeds[name]={'underlay':ip,'overlay':overlay,'pubkey':public}
        node(name,f'cp /state/pki/ca.crt /etc/meshagent/tls/ca.crt; cp /state/pki/client.crt /etc/meshagent/tls/client.crt; cp /state/pki/client.key /etc/meshagent/tls/client.key; cp /state/pki/ca.crt /etc/mesh-etcd/tls/ca.crt; cp /state/pki/{name}.crt /etc/mesh-etcd/tls/server.crt; cp /state/pki/{name}.key /etc/mesh-etcd/tls/server.key; chmod 600 /etc/meshagent/tls/* /etc/mesh-etcd/tls/*')
    (state/'known_hosts').write_text('\n'.join(known)+'\n')
    # Clear only earlier lab controller state; no keys from outside this lab are used.
    for file in (state/'controller').iterdir():
        if file.is_file():file.unlink()
    endpoints=[f'https://{overlay}:2389' for _,overlay in NODES.values()]
    tls={'ca_file':'/etc/meshagent/tls/ca.crt','cert_file':'/etc/meshagent/tls/client.crt','key_file':'/etc/meshagent/tls/client.key'}
    for name,(ip,overlay) in NODES.items():
        (state/f'{name}-nodes.json').write_text(json.dumps(seeds))
        cfg={'name':name,'overlay':overlay,'key_file':'/etc/wireguard/lab.key','nodes_file':'/etc/meshagent/nodes.json','etcd':endpoints,'etcd_tls':tls,'routing_policy':'priority'}
        (state/f'{name}.json').write_text(json.dumps(cfg))
        node(name, f'mkdir -p /usr/local/lib/meshagent; cp /app/agent/meshagent.py /usr/local/lib/meshagent/meshagent.py; cp /app/meshctl/routing.py /usr/local/lib/meshagent/routing.py; cp /state/{name}.json /etc/meshagent/config.json; cp /state/{name}-nodes.json /etc/meshagent/nodes.json; systemctl restart meshagent')
    # Let WireGuard establish overlay routes before starting the real three-member cluster.
    deadline=time.monotonic()+45
    while time.monotonic()<deadline:
        if '10.88.0.3' in node('entry','ip route show 10.88.0.3'):break
        time.sleep(1)
    cluster=','.join(f'{name}=https://{overlay}:2381' for name,(_,overlay) in NODES.items())
    for name,(ip,overlay) in NODES.items():
        command=f'docker run -d --name etcd --net host quay.io/coreos/etcd:v3.5.15 etcd --name={name} --data-dir=/etcd-data --initial-cluster-state=new --initial-cluster={cluster} --initial-cluster-token=mesh-lab --listen-client-urls=https://{overlay}:2389,https://127.0.0.1:2389 --advertise-client-urls=https://{overlay}:2389 --listen-peer-urls=https://{overlay}:2381 --initial-advertise-peer-urls=https://{overlay}:2381 --cert-file=/etcd-tls/server.crt --key-file=/etcd-tls/server.key --trusted-ca-file=/etcd-tls/ca.crt --client-cert-auth=true --peer-cert-file=/etcd-tls/server.crt --peer-key-file=/etcd-tls/server.key --peer-trusted-ca-file=/etcd-tls/ca.crt --peer-client-cert-auth=true'
        node(name,command)
    health='curl -sf --max-time 3 --cacert /etc/meshagent/tls/ca.crt --cert /etc/meshagent/tls/client.crt --key /etc/meshagent/tls/client.key https://127.0.0.1:2389/health'
    deadline=time.monotonic()+90
    while time.monotonic()<deadline:
        try:
            if all(json.loads(node(name,health)).get('health')=='true' for name in NODES):break
        except (RuntimeError,ValueError):pass
        time.sleep(2)
    else:raise AssertionError('real mTLS etcd quorum did not become healthy')
    put_code='from agent.meshagent import Etcd;import json\ncfg=json.load(open("/state/entry.json"));client=Etcd(cfg["etcd"],cfg["etcd_tls"])\nfor name,value in json.load(open("/state/entry-nodes.json")).items():client.put("/mesh/nodes/"+name,value)\n'
    process=subprocess.run(ALL+['exec','-T','entry','python','-'],input=put_code,capture_output=True,text=True)
    if process.returncode:raise RuntimeError(process.stderr[-1200:])
    config={'interval':5,'sni':'mesh-lab','probe_ports':[8443],'allow_private_nodes':True,
            'auto_switch':False,'auto_relay':False,'auto_ip_update':False,'entries':{'entry':{'host':NODES['entry'][0],'user':'root'}},
            'exits':{name:{'public_ip':ip,'user':'root','wg_ip':overlay,'probe':False} for name,(ip,overlay) in NODES.items() if name!='entry'},
            'mesh':{'read_via':[{'name':name,'host':ip,'user':'root'} for name,(ip,_) in NODES.items()],
                    'etcd_local_url':'https://127.0.0.1:2389','etcd_endpoints':endpoints,'etcd_tls':tls,'pki':{'ca_file':'/etcd-tls/ca.crt','ca_key_file':'/etcd-tls/ca.key'}}}
    (state/'controller-config.yaml').write_text(json.dumps(config))
    dbpassword=secrets.token_urlsafe(24);token=secrets.token_urlsafe(36)
    env={'APP_PORT':'3000','METRICS_PORT':'3001','DATABASE_URL':f'postgresql://mesh_lab:{dbpassword}@db:5432/mesh_lab','POSTGRES_USER':'mesh_lab','POSTGRES_PASSWORD':dbpassword,'POSTGRES_DB':'mesh_lab','APP_SECRET':secrets.token_urlsafe(48),'REDIS_HOST':'redis','REDIS_PORT':'6379','FRONT_END_DOMAIN':'*','SUB_PUBLIC_DOMAIN':'localhost:33080/api/sub','METRICS_USER':'lab','METRICS_PASS':secrets.token_urlsafe(24),'MESH_CONTROLLER_URL':'http://controller:8080','MESH_CONTROLLER_TOKEN':token,'MESH_API_TOKEN':token,'REMNAWAVE_BRANCH':'dev','IS_HTTP_LOGGING_ENABLED':'false'}
    envfile=state/'panel.env';envfile.write_text(''.join(key+'='+value+'\n' for key,value in env.items()));envfile.chmod(0o600)
    (state/'spare-fingerprint').write_text(fingerprint+'\n')
    if frontend_dist is not None:
        source=frontend_dist.resolve()
        if not source.exists():raise RuntimeError('Build the sibling frontend checkout first')
        shutil.copytree(source,state/'frontend',dirs_exist_ok=True)
    else:
        (state/'frontend').mkdir(exist_ok=True)
        (state/'frontend'/'index.html').write_text('<!doctype html><title>Mesh lab</title>API acceptance lab')
    run('up','-d','--build','db','redis','controller','panel','ui')
    print('Managed mesh/UI lab ready at http://127.0.0.1:33080',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--frontend-dist',type=Path)
    main(parser.parse_args().frontend_dist)

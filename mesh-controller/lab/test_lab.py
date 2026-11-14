#!/usr/bin/env python3
"""End-to-end WireGuard failover test. All resources belong to this Compose project."""
import json
import subprocess
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = ['docker', 'compose', '-p', 'rw-mesh-lab', '-f', str(HERE/'compose.yaml')]

def compose(*args, check=True):
    result = subprocess.run(BASE + list(args), capture_output=True, text=True)
    if check and result.returncode:
        raise RuntimeError(result.stderr[-1500:])
    return result.stdout.strip()

def execute(node, command, check=True):
    return compose('exec', '-T', node, 'sh', '-c', command, check=check)

def wait_for(description, predicate, timeout=150):
    end = time.monotonic()+timeout
    while time.monotonic()<end:
        if predicate():
            print('PASS:', description, flush=True)
            return
        time.sleep(3)
    raise AssertionError('Timed out: '+description)

def route(node):
    return execute(node, 'ip route get 10.88.0.3', check=False)

def request():
    return execute('entry', 'curl --silent --fail --insecure --connect-timeout 2 --max-time 4 https://10.88.0.3:8443', check=False)

def main():
    compose('down','--remove-orphans')
    compose('up','-d')
    state=HERE/'state';state.mkdir(exist_ok=True)
    seeds={}
    for i, node in enumerate(['entry','transit','exit'],1):
        public=execute(node, 'mkdir -p /etc/wireguard; umask 077; wg genkey > /etc/wireguard/lab.key; wg pubkey < /etc/wireguard/lab.key')
        seeds[node]={'underlay':f'172.30.88.{10+i}', 'overlay':f'10.88.0.{i}', 'pubkey':public}
    # Generate lab-only TLS material, isolated from all real deployments.
    execute('entry', 'umask 077; openssl req -x509 -newkey rsa:2048 -nodes -keyout /state/tls.key -out /state/cert.pem -days 1 -subj /CN=mesh-lab >/dev/null 2>&1')
    for i,node in enumerate(seeds,1):
        seed=state/f'{node}-nodes.json';seed.write_text(json.dumps(seeds))
        config={'name':node,'overlay':f'10.88.0.{i}','key_file':'/etc/wireguard/lab.key',
                'nodes_file':f'/state/{node}-nodes.json','etcd':['http://172.30.88.10:2379'],'routing_policy':'priority'}
        (state/f'{node}.json').write_text(json.dumps(config))
        compose('exec','-T','-d',node,'sh','-c',f'python /app/lab/node.py /state/{node}.json > /tmp/agent.log 2>&1')
    wait_for('direct encrypted TLS path',lambda:'"ok": true' in request() and 'dev wgm-exit' in route('entry'))
    # Block only the direct UDP pair. Transit remains available on separate WireGuard links.
    execute('entry','iptables -I OUTPUT 1 -d 172.30.88.13 -p udp --dport 52001 -j DROP; iptables -I INPUT 1 -s 172.30.88.13 -p udp --dport 52003 -j DROP')
    try:
        wait_for('route fails over through transit',lambda:'dev wgm-transit' in route('entry'))
        for _ in range(5):
            assert '"ok": true' in request(), 'TLS data failed on transit path'
        print('PASS: 5 TLS responses through transit',flush=True)
        # Disrupt the state store as well: forwarding must survive cached topology.
        compose('stop','etcd')
        time.sleep(6)
        assert '"ok": true' in request(), 'Store outage broke existing forwarding'
        print('PASS: forwarding survives etcd outage',flush=True)
    finally:
        compose('start','etcd')
        execute('entry','iptables -D OUTPUT -d 172.30.88.13 -p udp --dport 52001 -j DROP; iptables -D INPUT -s 172.30.88.13 -p udp --dport 52003 -j DROP')
    wait_for('direct route recovers',lambda:'dev wgm-exit' in route('entry') and '"ok": true' in request())
    compose('restart','transit')
    assert '"ok": true' in request()
    print('PASS: transit restart preserves direct traffic',flush=True)
    print('Local WireGuard lab completed',flush=True)

if __name__=='__main__': main()

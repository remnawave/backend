#!/usr/bin/env python3
"""Run after test_lab.py: real firewall isolation and explicit relay traffic.

All temporary network/container names belong only to the rw-mesh-lab test project.
"""
import json
import subprocess
import time
from test_lab import execute, wait_for

NETWORK='rw-mesh-lab-private-review'
VICTIM='rw-mesh-lab-private-victim'
EXIT='rw-mesh-lab-exit-1'


def docker(*args, check=True):
    result=subprocess.run(['docker',*args],capture_output=True,text=True)
    if check and result.returncode: raise RuntimeError(result.stderr[-1000:])
    return result.stdout.strip()


def main():
    rules={'source_ip':'10.88.0.1','rules':[{'id':'exit','target':'10.88.0.3','maps':[['tcp',45000,8443]]}]}
    # This is the production relay script, not a model of the rules.
    execute('entry',"cat > /tmp/relay-rules.json <<'EOF'\n"+json.dumps(rules)+"\nEOF\npython /app/agent/meshfwd.py apply /tmp/relay-rules.json")
    wait_for('explicitly configured DNAT relay still carries HTTPS',lambda:'"ok": true' in execute('transit','curl -skf --connect-timeout 2 --max-time 4 https://172.30.88.11:45000/',check=False))
    assert not docker('network','ls','--filter','name=^'+NETWORK+'$','--format','{{.Name}}')
    assert not docker('ps','-a','--filter','name=^'+VICTIM+'$','--format','{{.Names}}')
    created=False;attached=False;victim=False;frozen=False
    try:
        docker('network','create','--internal','--subnet','172.31.99.0/24','--label','com.docker.compose.project=rw-mesh-lab',NETWORK);created=True
        docker('network','connect','--ip','172.31.99.2',NETWORK,EXIT);attached=True
        docker('run','-d','--name',VICTIM,'--network',NETWORK,'--ip','172.31.99.20','--label','com.docker.compose.project=rw-mesh-lab','remnawave-mesh-lab:local','python','-m','http.server','18888');victim=True
        wait_for('private service is healthy from its own attached node',lambda:'OK' in execute('exit','curl -sf --max-time 2 http://172.31.99.20:18888/ >/dev/null && echo OK',check=False))
        # Simulate a compromised sender ignoring its own AllowedIPs restrictions.
        execute('entry',"python -c \"import os,signal; from pathlib import Path; [os.kill(int(p.name),signal.SIGSTOP) for p in Path('/proc').iterdir() if p.name.isdigit() and (p/'cmdline').read_bytes().split(bytes([0]))[1:2]==[b'/app/lab/node.py']]\"")
        frozen=True
        execute('entry','wg set wgm-exit peer "$(wg show wgm-exit peers)" allowed-ips 0.0.0.0/0; ip route add 172.31.99.20/32 dev wgm-exit src 10.88.0.1')
        # Ensure a working return path so a timeout cannot be a false isolation result.
        execute('exit','iptables -t nat -A POSTROUTING -s 10.88.0.1/32 -d 172.31.99.20/32 -j MASQUERADE')
        request=lambda:'OK' in execute('entry','curl -sf --connect-timeout 1 --max-time 2 http://172.31.99.20:18888/ >/dev/null && echo OK',check=False)
        def drops():
            lines=execute('exit','iptables -nvx -L MESHAGENT_FW').splitlines()
            return sum(int(parts[0]) for line in lines if len(parts:=line.split())>3 and parts[0].isdigit() and parts[2]=='DROP')
        before=drops()
        assert not request(), 'mesh peer reached a private network'
        assert drops()>before, 'the private request must hit the forwarding guard'
        print('PASS: compromised peer cannot reach the attached private network',flush=True)
        execute('exit','iptables -D FORWARD -j MESHAGENT_FW')
        try:
            execute('entry','iptables -D INPUT -i wgm+ -j MESHAGENT_IN')
            assert request(), 'positive control failed: the private path must work without the guard'
            print('PASS: positive control proves the firewall guard, rather than a missing route, blocks access',flush=True)
        finally:
            execute('exit','iptables -C FORWARD -j MESHAGENT_FW || iptables -I FORWARD 1 -j MESHAGENT_FW')
            execute('entry','iptables -C INPUT -i wgm+ -j MESHAGENT_IN || iptables -I INPUT 1 -i wgm+ -j MESHAGENT_IN')
        assert not request()
        print('PASS: restoring the guard blocks private access again',flush=True)
    finally:
        if frozen:
            execute('entry','ip route del 172.31.99.20/32 2>/dev/null || true; wg set wgm-exit peer "$(wg show wgm-exit peers)" allowed-ips 10.88.0.0/24,10.89.0.0/16',check=False)
            execute('entry',"python -c \"import os,signal; from pathlib import Path; [os.kill(int(p.name),signal.SIGCONT) for p in Path('/proc').iterdir() if p.name.isdigit() and (p/'cmdline').read_bytes().split(bytes([0]))[1:2]==[b'/app/lab/node.py']]\"",check=False)
        execute('exit','iptables -t nat -D POSTROUTING -s 10.88.0.1/32 -d 172.31.99.20/32 -j MASQUERADE',check=False)
        if victim:docker('rm','-f',VICTIM,check=False)
        if attached:docker('network','disconnect',NETWORK,EXIT,check=False)
        if created:docker('network','rm',NETWORK,check=False)


if __name__=='__main__':main()

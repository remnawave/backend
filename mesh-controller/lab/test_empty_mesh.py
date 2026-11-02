#!/usr/bin/env python3
"""Continue managed lifecycle acceptance from a fully removed mesh.

Proves the UI/API can bootstrap one, two, then three voters without an existing etcd.
Only disposable rw-mesh-lab containers and fixture credentials are used.
"""
import json
from prepare_managed import LAB_PASSWORD, NODES, node, run, HERE
from test_control_plane import api, job, wait, stopped


def main():
    wait('removed controller state survives restart',lambda:api('/status')['control_plane']['mode']=='removed')
    for index,(name,(host,_)) in enumerate(NODES.items(),1):
        fingerprint=node(name,'ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256').split()[1]
        job('/api/nodes',{'name':name,'host':host,'user':'root','role':'entry' if name=='entry' else 'exit',
                          'password':LAB_PASSWORD,'host_key_fingerprint':fingerprint,'etcd':True})
        if index<3:
            assert api('/status')['control_plane']['mode']=='standalone'
            assert all(stopped(member) for member in NODES)
            print(f'PASS: bootstrap {index} voter(s) without starting etcd',flush=True)
    wait('empty mesh bootstraps three healthy mTLS voters',lambda:api('/status')['quorum']['healthy']==3)
    assert all(len(json.loads(node(name, 'cat /etc/meshagent/config.json'))['etcd']) == 3 for name in NODES)
    wait('all bootstrap agents publish observations', lambda: len(api('/status')['overlay']['obs']) == 3)
    wait('all bootstrap WireGuard links are healthy', lambda: all(len(links) == 2 and all(link.get('ok') for link in links.values()) for links in api('/status')['overlay']['obs'].values()))
    overlay = api('/status')['overlay']['nodes']['exit']['overlay']
    wait('TLS forwarding on the rebuilt mesh', lambda: node('entry',f'curl -skf --connect-timeout 2 --max-time 5 https://{overlay}:8443/ >/dev/null && echo OK') == 'OK')
    print('PASS: real SSH onboarding from zero, first/second-voter pause and third-voter automatic startup',flush=True)


if __name__=='__main__':main()

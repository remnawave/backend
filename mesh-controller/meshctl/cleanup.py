"""Idempotent cleanup of owned mesh services, interfaces and firewall rules."""
import shlex
from .records import ipv4


def cleanup_node(node, spec):
    ipv4(spec['overlay'], overlay=True)
    node.run('set -e; for unit in meshagent meshfwd; do if systemctl cat $unit >/dev/null 2>&1; then systemctl disable --now $unit >/dev/null 2>&1; fi; done; '
                        'if docker inspect etcd >/dev/null 2>&1; then docker stop etcd >/dev/null; fi; '
                        'for c in FORWARD DOCKER-USER; do for f in -i -o; do while iptables -C $c $f wgm+ -j ACCEPT 2>/dev/null; do iptables -D $c $f wgm+ -j ACCEPT; done; done; done; '
                        'for rule in nat:PREROUTING:MESHFWD nat:POSTROUTING:MESHFWD_POST filter:FORWARD:MESHFWD_FW filter:DOCKER-USER:MESHFWD_FW filter:FORWARD:MESHAGENT_FW filter:DOCKER-USER:MESHAGENT_FW mangle:FORWARD:MESHFWD_MSS; do table=${rule%%:*}; tail=${rule#*:}; parent=${tail%%:*}; chain=${tail#*:}; while iptables -t $table -C $parent -j $chain 2>/dev/null; do iptables -t $table -D $parent -j $chain; done; done; '
                        'while iptables -C INPUT -i wgm+ -j MESHAGENT_IN 2>/dev/null; do iptables -D INPUT -i wgm+ -j MESHAGENT_IN; done; '
                        'for rule in nat:MESHFWD nat:MESHFWD_POST filter:MESHFWD_FW filter:MESHAGENT_FW filter:MESHAGENT_IN mangle:MESHFWD_MSS; do table=${rule%%:*}; chain=${rule#*:}; if iptables -t $table -S $chain >/dev/null 2>&1; then iptables -t $table -F $chain; iptables -t $table -X $chain; fi; done; '
                        'for device in $(ip -o link show | grep -o "wgm-[a-z0-9]*" | sort -u); do ip link del "$device"; done; '
                        f'ip addr del {shlex.quote(spec["overlay"] + "/32")} dev lo 2>/dev/null || true; '
                        'rm -rf /usr/local/lib/meshagent /etc/meshagent /etc/meshfwd; rm -f /usr/local/sbin/meshfwd.py /etc/systemd/system/meshfwd.service /etc/systemd/system/meshagent.service /etc/wireguard/wgmesh.key; systemctl daemon-reload', timeout=90)

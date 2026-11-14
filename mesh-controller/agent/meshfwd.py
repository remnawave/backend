#!/usr/bin/env python3
"""meshfwd — DNAT relays on an entry node, driven by /etc/meshfwd/rules.json.

    meshfwd.py apply [rules.json]    make iptables match the file (idempotent)

rules.json: {"rules": [{"id": "it", "target": "10.88.0.13",
                         "maps": [["tcp", 45000, 4433], ["udp", 45006, 5443]]}]}

Everything lives in our own chains (MESHFWD*), so other firewall rules, Docker and the
hand-made ru-fwd-* units are left alone. Stdlib only.
"""
from __future__ import annotations

import json
import ipaddress
import subprocess
import sys

MSS = 1200   # overlay MTU is 1280


def build_commands(rules: list, source_ip: str | None = None) -> list:
    """iptables argument lists that fill our (already flushed) chains."""
    if source_ip is not None:
        source_ip = str(ipaddress.IPv4Address(source_ip))
        if ipaddress.IPv4Address(source_ip) not in ipaddress.IPv4Network("10.88.0.0/24") or source_ip.endswith((".0", ".255")):
            raise ValueError("relay source must be a mesh overlay address")
    cmds = []
    for r in rules:
        t = str(ipaddress.IPv4Address(r["target"]))
        if ipaddress.IPv4Address(t) not in ipaddress.IPv4Network("10.88.0.0/24"):
            raise ValueError("relay target must be a mesh address")
        for proto, rport, tport in r["maps"]:
            if proto not in ("tcp", "udp") or any(type(port) is not int or not 1 <= port <= 65535 for port in (rport,tport)): raise ValueError("invalid relay port mapping")
            cmds.append(["-t", "nat", "-A", "MESHFWD", "-p", proto, "--dport", str(rport), "-j", "DNAT", "--to-destination", f"{t}:{tport}"])
            source_nat = ["SNAT", "--to-source", source_ip] if source_ip else ["MASQUERADE"]
            cmds.append(["-t", "nat", "-A", "MESHFWD_POST", "-d", t, "-p", proto, "--dport", str(tport), "-j", *source_nat])
            cmds.append(["-t", "filter", "-A", "MESHFWD_FW", "-d", t, "-p", proto, "--dport", str(tport), "-m", "conntrack", "--ctstate", "DNAT", "-j", "ACCEPT"])
            cmds.append(["-t", "filter", "-A", "MESHFWD_FW", "-s", t, "-p", proto, "--sport", str(tport), "-m", "conntrack", "--ctstate", "DNAT", "--ctdir", "REPLY", "-m", "state", "--state", "ESTABLISHED,RELATED", "-j", "ACCEPT"])
        cmds.append(["-t", "mangle", "-A", "MESHFWD_MSS", "-p", "tcp", "--tcp-flags", "SYN,RST", "SYN", "-d", t, "-j", "TCPMSS", "--set-mss", str(MSS)])
        cmds.append(["-t", "mangle", "-A", "MESHFWD_MSS", "-p", "tcp", "--tcp-flags", "SYN,RST", "SYN", "-s", t, "-j", "TCPMSS", "--set-mss", str(MSS)])
    return cmds


def ipt(*args, check=False) -> int:
    r = subprocess.run(["iptables", *args], capture_output=True, text=True)
    if check and r.returncode != 0:
        raise SystemExit(f"iptables {' '.join(args)}: {r.stderr.strip()}")
    return r.returncode


def ensure_chain(table: str, chain: str) -> None:
    ipt("-t", table, "-N", chain)            # fails if it exists: fine
    ipt("-t", table, "-F", chain, check=True)


def ensure_jump(table: str, parent: str, chain: str) -> None:
    if ipt("-t", table, "-C", parent, "-j", chain) != 0:
        ipt("-t", table, "-I", parent, "1", "-j", chain, check=True)


def apply(path: str = "/etc/meshfwd/rules.json") -> None:
    document = json.load(open(path))
    rules = document.get("rules", [])
    source_ip = document.get("source_ip")
    if rules and not source_ip:
        # Persistent agent configuration is available before interface creation at boot.
        # MASQUERADE otherwise picks a 10.89.x.y link address on a transit hop;
        # the exit has no return route to that address.
        with open("/etc/meshagent/config.json") as config:
            source_ip = json.load(config)["overlay"]
    commands = build_commands(rules, source_ip)
    for table, chain in (("nat", "MESHFWD"), ("nat", "MESHFWD_POST"), ("filter", "MESHFWD_FW"), ("mangle", "MESHFWD_MSS")):
        ensure_chain(table, chain)
    for c in commands:
        ipt(*c, check=True)
    fw_parent = "DOCKER-USER" if ipt("-S", "DOCKER-USER") == 0 else "FORWARD"
    ensure_jump("nat", "PREROUTING", "MESHFWD")
    ensure_jump("nat", "POSTROUTING", "MESHFWD_POST")
    ensure_jump("filter", fw_parent, "MESHFWD_FW")
    ensure_jump("mangle", "FORWARD", "MESHFWD_MSS")
    print(f"meshfwd: {sum(len(r['maps']) for r in rules)} forwards for {len(rules)} exits")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "apply":
        apply(*(sys.argv[2:3]))
    else:
        raise SystemExit(__doc__)

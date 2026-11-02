"""Provision the WireGuard mesh + etcd on the nodes over SSH.

    python -m meshctl.provision mesh.yaml plan       # show what would be done
    python -m meshctl.provision mesh.yaml apply      # install agents, etcd, seed membership
    python -m meshctl.provision mesh.yaml agents     # update agents only (etcd untouched)
    python -m meshctl.provision mesh.yaml teardown   # remove everything this tool installed

Idempotent: re-running converges. Keys are generated on the nodes and never
leave them; only public keys travel.
"""
from __future__ import annotations

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import yaml

from .app import Ssh
from .cleanup import cleanup_node

HERE = Path(__file__).resolve().parent
AGENT_DIR = HERE.parent / "agent"
LIB = "/usr/local/lib/meshagent"
UNIT = """[Unit]
Description=mesh agent (WireGuard overlay self-healing)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/bin/python3 {lib}/meshagent.py /etc/meshagent/config.json
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""
ETCD_IMAGE = "quay.io/coreos/etcd:v3.5.15"


class Node:
    def __init__(self, name: str, d: dict, ssh: Ssh):
        self.name, self.d, self.ssh = name, d, ssh
        self.sudo = "sudo -n " if d.get("sudo") else ""

    def run(self, cmd: str, stdin: str | None = None, timeout: int = 120) -> str:
        code, out, err = self.ssh.run(self.d["host"], self.d["user"], f"{self.sudo}bash -c {shquote(cmd)}", stdin=stdin, timeout=timeout)
        if code != 0:
            raise RuntimeError(f"[{self.name}] {cmd[:80]!r} -> {code}: {err.strip()[:300]}")
        return out

    def put(self, path: str, content: str, mode: str = "644") -> None:
        self.run(f"umask 077; mkdir -p $(dirname {shquote(path)}) && cat > {shquote(path + '.tmp')} && chmod {mode} {shquote(path + '.tmp')} && mv -f {shquote(path + '.tmp')} {shquote(path)}", stdin=content)


def shquote(s: str) -> str:
    return "'" + s.replace("'", "'\"'\"'") + "'"


def load(path: str):
    cfg = yaml.safe_load(open(path))
    ssh = Ssh(os.environ.get("MESHCTL_KEY", str(HERE.parent / ".meshctl_key")))
    nodes = {n: Node(n, d, ssh) for n, d in cfg["nodes"].items()}
    return cfg, nodes


def pubkey(n: Node) -> str:
    # /etc/wireguard: the AppArmor profile of `wg` on Ubuntu 26.04 allows reading keys only there
    n.run("mkdir -p /etc/meshagent /etc/wireguard && chmod 700 /etc/meshagent /etc/wireguard; "
          "[ -s /etc/wireguard/wgmesh.key ] || ([ -s /etc/meshagent/wg.key ] && cp -p /etc/meshagent/wg.key /etc/wireguard/wgmesh.key) "
          "|| (umask 077; wg genkey > /etc/wireguard/wgmesh.key)")
    return n.run("wg pubkey < /etc/wireguard/wgmesh.key").strip()


def plan(cfg, nodes):
    etcd = [n for n, x in cfg["nodes"].items() if x.get("etcd")]
    print(f"overlay {cfg['overlay_net']} port {cfg.get('port', 51888)}; nodes: {', '.join(nodes)}")
    print(f"etcd members: {', '.join(etcd)} ({ETCD_IMAGE})")
    for n, x in cfg["nodes"].items():
        print(f"  {n:4s} underlay {x['underlay']:16s} overlay {x['overlay']}")


def apply(cfg, nodes, agents_only=False):
    port = cfg.get("port", 51888)
    with ThreadPoolExecutor(8) as ex:
        pubs = dict(zip(nodes, ex.map(pubkey, nodes.values())))
    seed = {n: {"underlay": x["underlay"], "overlay": x["overlay"], "pubkey": pubs[n], "prio": x.get("prio", 0)} for n, x in cfg["nodes"].items()}
    etcd_names = [n for n, x in cfg["nodes"].items() if x.get("etcd")]
    for name in etcd_names:
        command = nodes[name].run("docker inspect etcd --format '{{json .Config.Cmd}}' 2>/dev/null || true")
        if '--client-cert-auth' in command:
            raise RuntimeError('TLS cluster detected: use meshctl.mtls agents/renew or panel membership management; legacy bootstrap cannot downgrade it')
    endpoints = [f"http://{cfg['nodes'][n]['overlay']}:2379" for n in etcd_names]
    agent = (AGENT_DIR / "meshagent.py").read_text()
    routing = (HERE / "routing.py").read_text()

    def install(n: Node):
        n.run("which wg >/dev/null || (DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wireguard-tools >/dev/null)")
        n.put(f"{LIB}/meshagent.py", agent, "755")
        n.put(f"{LIB}/routing.py", routing)
        n.put(f"{LIB}/records.py", (HERE / "records.py").read_text())
        n.put("/etc/meshagent/nodes.json", json.dumps(seed, indent=1), "600")
        n.put("/etc/meshagent/config.json", json.dumps({
            "name": n.name, "overlay": cfg["nodes"][n.name]["overlay"],
            "key_file": "/etc/wireguard/wgmesh.key", "etcd": endpoints, "nodes_file": "/etc/meshagent/nodes.json"}, indent=1), "600")
        n.put("/etc/systemd/system/meshagent.service", UNIT.format(lib=LIB))
        n.run("systemctl daemon-reload && systemctl enable meshagent >/dev/null 2>&1 && systemctl restart meshagent")
        return n.name

    with ThreadPoolExecutor(8) as ex:
        print("agents installed on:", ", ".join(ex.map(install, nodes.values())))

    if agents_only:
        return

    # etcd: needs the overlay up, so it comes after the agents
    cluster = ",".join(f"{n}=http://{cfg['nodes'][n]['overlay']}:2380" for n in etcd_names)

    def etcd(n: Node):
        ov = cfg["nodes"][n.name]["overlay"]
        n.run(f"docker rm -f etcd >/dev/null 2>&1; mkdir -p /var/lib/etcd && docker run -d --name etcd --restart always --net host "
              f"-v /var/lib/etcd:/etcd-data {ETCD_IMAGE} etcd --name {n.name} --data-dir /etcd-data "
              f"--listen-peer-urls http://{ov}:2380 --listen-client-urls http://{ov}:2379,http://127.0.0.1:2379 "
              f"--advertise-client-urls http://{ov}:2379 --initial-advertise-peer-urls http://{ov}:2380 "
              f"--initial-cluster {cluster} --initial-cluster-state new --initial-cluster-token meshetcd "
              f"--auto-compaction-retention=1 --quota-backend-bytes=268435456", timeout=300)
        return n.name

    print("waiting for the overlay to come up...")
    time.sleep(40)
    with ThreadPoolExecutor(4) as ex:
        print("etcd started on:", ", ".join(ex.map(etcd, [nodes[n] for n in etcd_names])))

    # seed membership into etcd (agents read it and keep nodes.json in sync)
    import base64
    first = nodes[etcd_names[0]]
    for _ in range(20):
        try:
            h = first.run("curl -s -m 3 http://127.0.0.1:2379/health")
            if '"health":"true"' in h:
                break
        except Exception:  # noqa: BLE001
            pass
        time.sleep(5)
    for n, v in seed.items():
        body = json.dumps({"key": base64.b64encode(f"/mesh/nodes/{n}".encode()).decode(),
                           "value": base64.b64encode(json.dumps(v).encode()).decode()})
        first.run(f"curl -s -m 5 -X POST http://127.0.0.1:2379/v3/kv/put -d {shquote(body)} >/dev/null")
    print("etcd health:", first.run("curl -s -m 3 http://127.0.0.1:2379/health").strip())


def teardown(cfg, nodes):
    def down(n: Node):
        cleanup_node(n, {'overlay': cfg['nodes'][n.name]['overlay']})
        return n.name
    with ThreadPoolExecutor(8) as ex:
        print("removed from:", ", ".join(ex.map(down, nodes.values())))


if __name__ == "__main__":
    cfg_path, action = sys.argv[1], sys.argv[2]
    c, ns = load(cfg_path)
    {"plan": plan, "apply": apply, "agents": lambda c, n: apply(c, n, agents_only=True), "teardown": teardown}[action](c, ns)

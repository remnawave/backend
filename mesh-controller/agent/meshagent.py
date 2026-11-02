#!/usr/bin/env python3
"""meshagent — one per node. Keeps the WireGuard overlay up and self-heals routes.

Design: one WireGuard interface per link (wgm-<peer>) with AllowedIPs 0.0.0.0/0, and the
kernel routing table decides the path (`ip route 10.88.0.D/32 dev wgm-<via>`). A single
shared interface would force both ends of a pair to switch in lock-step (WireGuard drops
packets whose source is not in the peer's AllowedIPs); with a device per link every node
decides on its own and asymmetric paths just work.

Stdlib only (runs on any server with python3 >= 3.9). State sharing goes through
etcd's JSON gateway; if etcd is unreachable the agent keeps working from its
local view and the last known graph, so the overlay never depends on the store.

Config: /etc/meshagent/config.json
  {"name": "uk", "overlay": "10.88.0.12", "port": 51888, "iface": "wgmesh",
   "key_file": "/etc/wireguard/wgmesh.key", "etcd": ["http://10.88.0.12:2379", ...],
   "nodes_file": "/etc/meshagent/nodes.json"}
nodes.json (seed, written by the provisioner; etcd /mesh/nodes/ overrides it):
  {"ru1": {"underlay": "1.2.3.4", "overlay": "10.88.0.1", "pubkey": "..."}, ...}
"""
from __future__ import annotations

import base64
import json
import logging
import os
import socket
import ssl
import struct
import subprocess
import sys
import threading
import time
import urllib.request

try:
    from meshctl.routing import LinkTracker, LinkQuality, next_hops
except ImportError:  # installed flat on the node
    from routing import LinkTracker, LinkQuality, next_hops

log = logging.getLogger("meshagent")
ROUND = 5           # seconds between rounds
SEEN_WINDOW = 3     # consecutive failed probes before a link is declared down
KEEPALIVE = 25      # only for NAT/conntrack; liveness is decided by active pings
LINK_NET = '10.89'  # per-link point-to-point addresses: {LINK_NET}.<my octet>.<peer octet>
BASE_PORT = 52000   # iface for peer Y on node X listens on BASE_PORT + last octet of Y
LEASE_TTL = 60


def sh(cmd: str, check: bool = False) -> str:
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"{cmd}: {r.stderr.strip()}")
    return r.stdout


def icmp_ping(dev: str, target: str, timeout: float = 1.0):
    """One ICMP echo through a given device; returns rtt in ms or None.

    A raw socket instead of the `ping` binary: its options differ between distros
    (e.g. inetutils-ping on Ubuntu 22.04 has no -I). Needs root, which the agent has.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_ICMP)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_BINDTODEVICE, dev.encode() + b"\0")
        s.settimeout(timeout)
        ident = os.getpid() & 0xFFFF
        seq = int(time.time() * 1000) & 0xFFFF
        payload = b"meshagent-probe!"   # even length: no padding needed in the checksum
        hdr = struct.pack("!BBHHH", 8, 0, 0, ident, seq)
        data = hdr + payload
        total = sum(struct.unpack("!%dH" % (len(data) // 2), data if len(data) % 2 == 0 else data + b"\0"))
        total = (total >> 16) + (total & 0xFFFF)
        total += total >> 16
        csum = ~total & 0xFFFF
        pkt = struct.pack("!BBHHH", 8, 0, csum, ident, seq) + payload
        t0 = time.time()
        s.sendto(pkt, (target, 0))
        while time.time() - t0 < timeout:
            reply, addr = s.recvfrom(1024)
            ihl = (reply[0] & 0x0F) * 4
            typ, _code, _c, rid, rseq = struct.unpack("!BBHHH", reply[ihl:ihl + 8])
            if typ == 0 and rid == ident and rseq == seq and addr[0] == target:
                return (time.time() - t0) * 1000.0
        return None
    except Exception:  # noqa: BLE001
        return None
    finally:
        try:
            s.close()
        except Exception:  # noqa: BLE001
            pass


def detect_public_ip(probe_target: str = "1.1.1.1"):
    """Primary source address of this host if it is a public one (None behind NAT / private nets).

    Used to notice that the hoster changed our address; the controller then updates DNS,
    Remnawave and the other peers. Behind NAT the source is private, so nothing is reported.
    """
    import ipaddress
    out = sh(f"ip -4 route get {probe_target} 2>/dev/null")
    toks = out.split()
    if "src" not in toks:
        return None
    ip = toks[toks.index("src") + 1]
    try:
        return ip if ipaddress.ip_address(ip).is_global else None
    except ValueError:
        return None


def b64(s: str) -> str:
    return base64.b64encode(s.encode()).decode()


class Etcd:
    """Minimal etcd v3 client over the JSON gateway."""

    def __init__(self, endpoints, tls=None):
        self.endpoints = list(endpoints)
        self.context = None
        if tls:
            if not all(ep.startswith("https://") for ep in self.endpoints):
                raise ValueError("mTLS endpoints must use HTTPS; no HTTP fallback")
            self.context = ssl.create_default_context(cafile=tls["ca_file"])
            self.context.load_cert_chain(tls["cert_file"], tls["key_file"])
            self.context.minimum_version = ssl.TLSVersion.TLSv1_2
        elif any(ep.startswith("https://") for ep in self.endpoints):
            raise ValueError("HTTPS etcd requires CA and client certificate configuration")

    def call(self, path: str, body: dict, timeout: float = 3.0) -> dict:
        err = None
        for ep in self.endpoints:
            try:
                req = urllib.request.Request(ep + "/v3" + path, data=json.dumps(body).encode(),
                                             headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=timeout, context=self.context) as r:
                    return json.loads(r.read() or b"{}")
            except Exception as e:  # noqa: BLE001
                err = e
        raise RuntimeError(f"etcd unreachable: {err}")

    def put(self, key: str, value: dict, ttl: int = 0) -> None:
        body = {"key": b64(key), "value": b64(json.dumps(value))}
        if ttl:
            body["lease"] = self.call("/lease/grant", {"TTL": ttl})["ID"]
        self.call("/kv/put", body)

    def prefix(self, prefix: str) -> dict:
        end = prefix[:-1] + chr(ord(prefix[-1]) + 1)
        out = {}
        for kv in self.call("/kv/range", {"key": b64(prefix), "range_end": b64(end)}).get("kvs", []):
            out[base64.b64decode(kv["key"]).decode()] = json.loads(base64.b64decode(kv.get("value", "")) or b"null")
        return out


class Agent:
    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.name = cfg["name"]
        self.quality = {}
        self.quality_hops = {}
        self.loads = {}
        self.etcd = Etcd(cfg.get("etcd", []), cfg.get("etcd_tls")) if cfg.get("etcd") else None
        self.nodes = self.load_nodes()
        self.trackers: dict[str, LinkTracker] = {}
        self.graph: dict = {}
        self.applied_endpoint: dict[str, str] = {}   # peer -> "ip:port" we last wrote

    # ---- membership ----------------------------------------------------
    def load_nodes(self) -> dict:
        nodes = json.load(open(self.cfg["nodes_file"]))
        return nodes

    def refresh_nodes(self) -> None:
        if not self.etcd:
            return
        try:
            kv = self.etcd.prefix("/mesh/nodes/")
            if kv:
                self.nodes = {k.rsplit("/", 1)[1]: v for k, v in kv.items() if v}
                json.dump(self.nodes, open(self.cfg["nodes_file"], "w"))
            control = self.etcd.prefix("/mesh/control/")
            record = control.get("/mesh/control/etcd") or {}
            endpoints = [m["client_url"] for m in record.get("members", [])]
            if endpoints and endpoints != self.etcd.endpoints:
                if self.cfg.get("etcd_tls") and not all(ep.startswith("https://") for ep in endpoints):
                    raise ValueError("refusing unauthenticated discovered endpoints")
                self.etcd.endpoints = endpoints
                self.cfg["etcd"] = endpoints
                if len(sys.argv) > 1 and sys.argv[1].endswith(".json"):
                    path = sys.argv[1]
                    with open(path + ".tmp", "w", opener=lambda p, flags: os.open(p, flags, 0o600)) as f:
                        json.dump(self.cfg, f); f.flush(); os.fsync(f.fileno())
                    os.replace(path + ".tmp", path)
        except Exception as e:  # noqa: BLE001
            log.debug("nodes refresh: %s", e)

    # ---- interfaces ----------------------------------------------------
    @staticmethod
    def octet(ip: str) -> int:
        return int(ip.rsplit(".", 1)[1])

    def link_addr(self, mine: str, theirs: str) -> str:
        return f"{LINK_NET}.{self.octet(mine)}.{self.octet(theirs)}"

    def link_peer(self, mine: str, theirs: str) -> str:
        return f"{LINK_NET}.{self.octet(theirs)}.{self.octet(mine)}"

    def dev(self, peer: str) -> str:
        return f"wgm-{peer}"[:15]

    def ensure_links(self) -> None:
        """Overlay address on lo, one wireguard device per peer, forwarding open."""
        sh("sysctl -qw net.ipv4.ip_forward=1")
        sh(f"ip addr replace {self.cfg['overlay']}/32 dev lo")
        if "wgmesh:" in sh("ip -o link show"):          # migrate from the single-interface layout
            sh("ip link del wgmesh")
        existing = sh("ip -o link show")
        me = self.octet(self.cfg["overlay"])
        for p, n in self.nodes.items():
            if p == self.name:
                continue
            d = self.dev(p)
            if f" {d}:" not in existing:
                sh(f"ip link add {d} type wireguard", check=True)
            port = BASE_PORT + self.octet(n["overlay"])
            ep = f"{n['underlay']}:{BASE_PORT + me}"
            # Set the endpoint only when it changed: WireGuard learns a peer's new address by
            # itself (roaming) and rewriting the old one every round would undo that.
            ep_part = f"endpoint {ep} " if (self.applied_endpoint.get(p) != ep or f" {d}:" not in existing) else ""
            sh(f"wg set {d} private-key {self.cfg['key_file']} listen-port {port} "
               f"peer {n['pubkey']} {ep_part}"
               f"allowed-ips 0.0.0.0/0 persistent-keepalive {KEEPALIVE}", check=True)
            self.applied_endpoint[p] = ep
            sh(f"ip link set {d} mtu 1280 up")
            sh(f"ip addr replace {self.link_addr(self.cfg['overlay'], n['overlay'])} peer {self.link_peer(self.cfg['overlay'], n['overlay'])} dev {d}")
            sh(f"sysctl -qw net.ipv4.conf.{d}.rp_filter=0")
        # devices of nodes that were removed from the mesh
        wanted = {self.dev(p) for p in self.nodes if p != self.name}
        for line in sh("ip -o link show").splitlines():
            parts = line.split(": ")
            if len(parts) > 1:
                dev = parts[1].split("@")[0]
                if dev.startswith("wgm-") and dev not in wanted:
                    sh(f"ip link del {dev}")
                    log.info("removed stale device %s", dev)
        chain = "DOCKER-USER" if sh("iptables -S DOCKER-USER 2>/dev/null") else "FORWARD"
        for d in ("-i", "-o"):
            if sh(f"iptables -C {chain} {d} wgm+ -j ACCEPT 2>&1 >/dev/null; echo $?").strip() != "0":
                sh(f"iptables -I {chain} 1 {d} wgm+ -j ACCEPT")
            sh(f"iptables -D {chain} {d} wgmesh -j ACCEPT 2>/dev/null")      # old layout leftovers

    def apply_routes(self, hops: dict) -> None:
        """One /32 route per destination, via its own device or via the transit's."""
        for d, n in self.nodes.items():
            if d == self.name:
                continue
            via = hops.get(d) or d
            sh(f"ip route replace {n['overlay']}/32 dev {self.dev(via)} src {self.cfg['overlay']} metric 50")

    # ---- measuring -----------------------------------------------------
    def measure(self) -> dict:
        """Active probe of every link: ping the peer's point-to-point address on its own device.

        The address belongs to the link, so the answer always comes back over the same device
        no matter which transit the overlay routes currently use (passive rx counters are
        useless: persistent keepalive is suppressed by incoming packets, so one side of a
        healthy link can stay silent forever).
        """
        results: dict = {}
        threads = []

        def probe(p, n):
            results[p] = icmp_ping(self.dev(p), self.link_peer(self.cfg["overlay"], n["overlay"]))

        for p, n in self.nodes.items():
            if p == self.name:
                continue
            t = threading.Thread(target=probe, args=(p, n), daemon=True)
            t.start()
            threads.append(t)
        for t in threads:
            t.join(3)
        obs = {}
        for p in self.nodes:
            if p == self.name:
                continue
            rtt = results.get(p)
            tracker = self.trackers.setdefault(p, LinkTracker(down_after=SEEN_WINDOW, up_after=3))
            quality = self.quality.setdefault(p, LinkQuality()).update(rtt)
            obs[p] = {"ok": tracker.update(rtt is not None), **quality}
        return obs

    # ---- main loop -----------------------------------------------------
    def round(self) -> None:
        self.refresh_nodes()
        self.ensure_links()
        local = self.measure()
        graph = {self.name: local}
        load = round(os.getloadavg()[0] / max(os.cpu_count() or 1, 1), 2)
        self.loads[self.name] = load
        if self.etcd:
            try:
                self.etcd.put(f"/mesh/obs/{self.name}", {"ts": int(time.time()), "links": local, "ip": detect_public_ip(), "load": load}, ttl=LEASE_TTL)
                for k, v in self.etcd.prefix("/mesh/obs/").items():
                    peer = k.rsplit("/", 1)[1]
                    graph[peer] = (v or {}).get("links", {})
                    self.loads[peer] = (v or {}).get("load", 0)
                self.graph = graph
            except Exception as e:  # noqa: BLE001
                log.warning("etcd: %s (using last known graph)", e)
                graph = {**self.graph, self.name: local}
        names = list(self.nodes)
        prio = {n: v.get("prio", 0) for n, v in self.nodes.items()}
        hops = next_hops(names, graph, self.name, prio, quality=self.cfg.get("routing_policy", "quality") == "quality",
                         current=self.quality_hops, loads=self.loads)
        self.quality_hops = hops
        self.apply_routes(hops)
        via = {d: h for d, h in hops.items() if h}
        status = {"node": self.name, "ts": int(time.time()), "links": local, "via": via}
        os.makedirs("/run/meshagent", exist_ok=True)
        json.dump(status, open("/run/meshagent/status.json", "w"))
        if self.etcd:
            try:
                self.etcd.put(f"/mesh/route/{self.name}", {"ts": status["ts"], "via": via}, ttl=LEASE_TTL)
            except Exception:  # noqa: BLE001
                pass
        if via:
            log.info("routes via transit: %s", via)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    cfg = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "/etc/meshagent/config.json"))
    a = Agent(cfg)
    while True:
        t0 = time.time()
        try:
            a.round()
        except Exception:  # noqa: BLE001
            log.exception("round failed")
        time.sleep(max(1, ROUND - (time.time() - t0)))


if __name__ == "__main__":
    main()

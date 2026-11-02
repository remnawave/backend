"""meshctl — probes entry->exit paths, exports metrics, self-heals the relay mesh.

Runs alongside the panel. Talks to servers over SSH (mounted controller key) and
to the Remnawave API. Everything that changes production is behind flags in
config.yaml (auto_balancer, auto_switch) so the service can run observe-only.
"""
from __future__ import annotations

import base64
import hmac
import hashlib
import json
import logging
import os
from pathlib import Path
import socket
import ssl
import threading
from concurrent.futures import ThreadPoolExecutor
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Dict, List, Optional

import paramiko
import requests
import yaml
from prometheus_client import CollectorRegistry, Gauge, generate_latest

from .ops import ETCD_PREFIXES, Ops, b64
from .selection import select_balancer
from .balancer import backend_route
from .transport import curl_etcd
from .core import (
    ExitState,
    PathResult,
    build_probe_script,
    choose_path,
    exit_ok_from_entries,
    parse_probe_output,
)

log = logging.getLogger("meshctl")


class Ssh:
    """Reuse a bounded number of SSH transports; never replay an uncertain command."""
    def __init__(self, key_path: str, jumps=None):
        self.key = paramiko.Ed25519Key.from_private_key_file(key_path)
        self.pool = {}
        self.host_locks = {}
        self.pool_lock = threading.Lock()
        self.jumps = jumps or {}
        self.known_hosts = os.environ.get("MESHCTL_KNOWN_HOSTS", "/secrets/known_hosts")
        directory = os.environ.get("MESHCTL_STATE_DIR")
        self.trusted_hosts = Path(directory) / "known_hosts" if directory else None
        self.trust_lock = threading.Lock()

    @staticmethod
    def fingerprint(key):
        return "SHA256:" + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip("=")

    def remember_host(self, hostname, key):
        if self.trusted_hosts is None:
            raise ValueError("Persistent controller state is required to trust a new SSH host")
        with self.trust_lock:
            keys = paramiko.HostKeys()
            if self.trusted_hosts.exists():
                keys.load(str(self.trusted_hosts))
            keys.add(hostname, key.get_name(), key)
            self.trusted_hosts.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            temporary = self.trusted_hosts.with_suffix(".tmp")
            keys.save(str(temporary))
            temporary.chmod(0o600)
            os.replace(temporary, self.trusted_hosts)

    def client(self, expected=None):
        client = paramiko.SSHClient()
        client.load_host_keys(self.known_hosts)
        if self.trusted_hosts and self.trusted_hosts.exists():
            client.load_host_keys(str(self.trusted_hosts))
        owner = self
        class VerifiedFingerprint(paramiko.MissingHostKeyPolicy):
            def missing_host_key(self, ssh_client, hostname, key):
                if not expected or not hmac.compare_digest(owner.fingerprint(key), expected):
                    raise paramiko.SSHException("SSH host fingerprint does not match the independently verified value")
                owner.remember_host(hostname, key)
        client.set_missing_host_key_policy(VerifiedFingerprint() if expected else paramiko.RejectPolicy())
        return client

    def run(self, host: str, user: str, cmd: str, stdin: Optional[str] = None, timeout: int = 60) -> tuple[int, str, str]:
        ident = (host, user)
        with self.pool_lock:
            lock = self.host_locks.setdefault(ident, threading.Lock())
        with lock:
            c = self.pool.get(ident)
            transport = c.get_transport() if c else None
            if not transport or not transport.is_active():
                if c: c.close()
                for attempt in range(3):
                    c = self.client()
                    try:
                        options = {}
                        if host in self.jumps:
                            jump = self.jumps[host]
                            if jump['host'] == host or jump['host'] in self.jumps:
                                raise ValueError('nested SSH jump hosts are not supported')
                            self.run(jump['host'], jump.get('user', 'root'), 'true', timeout=15)
                            gateway = self.pool[(jump['host'], jump.get('user', 'root'))].get_transport()
                            options['sock'] = gateway.open_channel('direct-tcpip', (jump.get('target', host), 22),
                                                                   ('127.0.0.1', 0), timeout=15)
                        c.connect(host, port=22, username=user, pkey=self.key, timeout=15, banner_timeout=15, auth_timeout=15,
                                  allow_agent=False, look_for_keys=False, **options)
                        c.get_transport().set_keepalive(15)
                        self.pool[ident] = c
                        break
                    except (OSError, paramiko.SSHException) as ex:
                        c.close()
                        if isinstance(ex, paramiko.AuthenticationException) or attempt == 2:
                            raise
                        # No remote command has started, so reconnecting is safe.
                        time.sleep(1 + attempt)
            try:
                i, o, e = c.exec_command(cmd, timeout=timeout)
                if stdin is not None:
                    i.write(stdin)
                i.channel.shutdown_write()
                channel = o.channel
                out, err = bytearray(), bytearray()
                deadline = time.monotonic() + timeout
                while True:
                    while channel.recv_ready(): out.extend(channel.recv(65536))
                    while channel.recv_stderr_ready(): err.extend(channel.recv_stderr(65536))
                    if channel.exit_status_ready() and not channel.recv_ready() and not channel.recv_stderr_ready():
                        break
                    if time.monotonic() > deadline:
                        raise TimeoutError("SSH command timed out; outcome must be reconciled, not blindly replayed")
                    time.sleep(0.01)
                status = channel.recv_exit_status()
                channel.close()
                return status, out.decode(errors="replace"), err.decode(errors="replace")
            except Exception:
                self.pool.pop(ident, None)
                c.close()
                raise


def local_probe(ip: str, port: int, sni: str, tries: int = 3) -> PathResult:
    """TLS probe from this pod (the 'abroad' vantage point)."""
    res = PathResult()
    for _ in range(tries):
        res.total += 1
        t0 = time.time()
        try:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with socket.create_connection((ip, port), timeout=5) as s:
                with ctx.wrap_socket(s, server_hostname=sni) as t:
                    t.settimeout(5)
                    t.sendall(f"GET / HTTP/1.1\r\nHost: {sni}\r\nConnection: close\r\n\r\n".encode())
                    if t.recv(16).startswith(b"HTTP/"):
                        res.ok += 1
                        res.ms = max(res.ms, int((time.time() - t0) * 1000))
        except Exception:
            pass
    return res


def etcd_range_cmd(prefixes: List[str], config=None) -> str:
    """Shell snippet printing one JSON document per prefix, run on an etcd member."""
    import base64 as b
    parts = []
    curl, endpoint = curl_etcd(config or {}, timeout=4)
    for pre in prefixes:
        end = pre[:-1] + chr(ord(pre[-1]) + 1)
        body = json.dumps({"key": b.b64encode(pre.encode()).decode(), "range_end": b.b64encode(end.encode()).decode()})
        parts.append(f"{curl} -X POST {endpoint}/v3/kv/range -d '{body}'; echo")
    return "set -e; " + "; ".join(parts)


def decode_kvs(doc: str) -> Dict[str, dict]:
    import base64 as b
    out = {}
    for kv in (json.loads(doc).get("kvs", []) if doc.strip() else []):
        out[b.b64decode(kv["key"]).decode().rsplit("/", 1)[1]] = json.loads(b.b64decode(kv.get("value", "")) or b"null")
    return out


class Rw:
    def __init__(self, base: str, token: str):
        self.base, self.h = base.rstrip("/"), {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def req(self, m: str, p: str, body: Optional[dict] = None) -> dict:
        r = requests.request(m, self.base + p, headers=self.h, json=body, timeout=30)
        r.raise_for_status()
        return r.json().get("response", {})

    def balancer(self, uuid=None, name=None) -> dict:
        return select_balancer(self.req("GET", "/api/balancers"), uuid=uuid, name=name)

    def set_disabled(self, balancer: dict, disabled: Dict[str, bool]) -> None:
        nodes = [{"nodeUuid": n["nodeUuid"], "weight": n["weight"],
                  "isDisabled": disabled.get(n["nodeName"], n["isDisabled"])} for n in balancer["nodes"]]
        self.req("PATCH", "/api/balancers", {"uuid": balancer["uuid"], "nodes": nodes})


class Mesh(Ops):
    def __init__(self, cfg: dict, ssh: Ssh, rw: Optional[Rw]):
        self.cfg, self.ssh, self.rw = cfg, ssh, rw
        self.state: Dict[str, ExitState] = {
            n: ExitState(path=(x.get("fwd") or {}).get("path", "direct")) for n, x in cfg["exits"].items()}
        self.matrix: Dict[str, Dict[str, Dict[str, PathResult]]] = {}
        self.local: Dict[str, PathResult] = {}
        self.ssh_ok: Dict[str, bool] = {}
        self.events: deque = deque(maxlen=200)
        self.cycle_ts = 0.0
        self.cycles = 0
        self.balancer_error: Optional[str] = None
        self.balancer_state: Dict[str, bool] = {}   # node -> isDisabled (as seen)
        self.selected_balancer_uuid: Optional[str] = None
        self.backend_routes: dict = {}
        self.routes_owner_uuid: Optional[str] = None
        directory = os.environ.get("MESHCTL_STATE_DIR")
        self.routes_cache = Path(directory) / "balancer-routes.json" if directory else None
        if self.routes_cache and self.routes_cache.exists():
            record = json.loads(self.routes_cache.read_text())
            self.selected_balancer_uuid = record.get("balancer_uuid")
            self.routes_owner_uuid = record.get("balancer_uuid")
            self.backend_routes = record.get("routes", {})
        self.mesh: Dict[str, dict] = {"etcd_up": False, "nodes": {}, "obs": {}, "route": {}}
        self.flags: dict = {}
        self.log_loaded = False
        self.agent_ts: Dict[str, int] = {}
        self.quorum: dict = {"members": [], "quorum": None, "leader": None, "healthy": 0, "size": 0}
        self.wake = threading.Event()
        self.lock = threading.Lock()
        self.init_ops()

    # ---- probing -------------------------------------------------------
    def _probe_entry(self, name: str, e: dict) -> Optional[Dict[str, Dict[str, PathResult]]]:
        exits = {n: x for n, x in self.cfg["exits"].items() if x.get("probe", True)}
        script = build_probe_script(exits, self.cfg["probe_ports"], self.cfg["sni"])
        try:
            code, out, err = self.ssh.run(e["host"], e["user"], "bash -s", stdin=script, timeout=90)
            self.ssh_ok[name] = True
            return parse_probe_output(out)
        except Exception as ex:  # noqa: BLE001
            self.ssh_ok[name] = False
            log.warning("probe %s failed: %s", name, ex)
            return None

    def probe_all(self) -> None:
        results: Dict[str, Optional[dict]] = {}
        threads = []

        def work(n, e):
            results[n] = self._probe_entry(n, e)

        for n, e in self.cfg["entries"].items():
            t = threading.Thread(target=work, args=(n, e), daemon=True)
            t.start()
            threads.append(t)
        local: Dict[str, PathResult] = {}
        jobs = [(n, x["public_ip"], p) for n, x in self.cfg["exits"].items() if x.get("probe", True) for p in self.cfg["probe_ports"]]
        with ThreadPoolExecutor(max_workers=16) as pool:
            futs = [(n, pool.submit(local_probe, ip, p, self.cfg["sni"])) for n, ip, p in jobs]
            for n, f in futs:
                r = f.result()
                agg = local.setdefault(n, PathResult())
                agg.ok += r.ok
                agg.total += r.total
                agg.ms = max(agg.ms, r.ms)
        for t in threads:
            t.join(100)
        with self.lock:
            self.matrix = {n: r for n, r in results.items() if r is not None}
            self.local = local
            self.cycle_ts = time.time()
            self.cycles += 1

    # ---- runtime flags -------------------------------------------------
    def flag(self, name: str):
        """Config value, overridden by flags saved from the panel (etcd /mesh/flags/main)."""
        v = self.flags.get(name)
        return self.cfg.get(name) if v is None else v

    def pinned(self) -> set:
        return set(self.cfg.get("balancer_pin_disabled", [])) | set(self.flags.get("pin_disabled", []))

    def save_flags(self, patch: dict) -> dict:
        if getattr(self, 'plane_state', {}).get('mode', 'etcd') not in ('etcd', 'standalone'):
            raise ValueError('complete the current control-plane operation before changing settings')
        with self.flags_lock:
            return self._save_flags_locked(patch)

    def _save_flags_locked(self, patch: dict) -> dict:
        """Merge `patch` into the saved flags and write them to etcd through a member."""
        allowed = {"auto_balancer": bool, "auto_switch": bool, "auto_relay": bool, "auto_ip_update": bool}
        # read-modify-write against etcd itself: the in-memory copy can be stale (e.g. right after a
        # restart) and writing it back would silently reset switches somebody else turned on
        got = self.etcd_rpc("/kv/range", {"key": b64("/mesh/flags/main")}).get("kvs", [])
        new = json.loads(base64.b64decode(got[0]["value"])) if got else {}
        for k, v in patch.items():
            if k in allowed and isinstance(v, allowed[k]):
                new[k] = v
        if "pin_disabled" in patch and isinstance(patch["pin_disabled"], list):
            known = {x.get("rw_node") for x in self.cfg["exits"].values()}
            new["pin_disabled"] = sorted({n for n in patch["pin_disabled"] if n in known})
        if "relay_modes" in patch:
            modes = patch["relay_modes"]
            if not isinstance(modes, dict) or any(n not in self.cfg["exits"] or m not in ("auto", "direct", "relay") for n, m in modes.items()):
                raise ValueError("invalid relay mode")
            new["relay_modes"] = {**(new.get("relay_modes") or {}), **modes}
        self.etcd_put("/mesh/flags/main", new)
        with self.lock:
            self.flags = new
            self.flags_generation += 1
        self.event(f"settings changed from the panel: {patch}", "flags")
        self.wake.set()
        return new

    def read_mesh(self, force=False) -> None:
        """Read the overlay state and the dynamic inventory from etcd (through a member)."""
        if not force and (self.etcd_running or self.node_operation_lock.locked()):
            return
        if self.standalone():
            self.load_standalone()
            return
        flags_generation, relay_generation, control_generation = self.flags_generation, self.relay_generation, self.control_generation
        for m in self.members():
            try:
                code, out, err = self.member_run(m, etcd_range_cmd(ETCD_PREFIXES, self.cfg), timeout=30)
                docs = out.strip().split("\n")
                if code != 0 or len(docs) < len(ETCD_PREFIXES):
                    continue
                nodes, obs, route, flags, inv, relay, ipmap, logdocs, control = (decode_kvs(d) for d in docs[:len(ETCD_PREFIXES)])
                with self.lock:
                    if self.flags_generation == flags_generation:
                        self.flags = flags.get("main") or {}
                    if self.control_generation == control_generation:
                        self.control.update({k: v for k, v in control.items() if v})
                    self.inventory = {k: v for k, v in inv.items() if v}
                    if self.relay_generation == relay_generation:
                        self.relay_state = {k: v for k, v in relay.items() if v}
                    self.ipmap = {k: v for k, v in ipmap.items() if v}
                    self.reported_ip = {k: (v or {}).get("ip") for k, v in obs.items() if (v or {}).get("ip")}
                    self.agent_ts = {k: (v or {}).get("ts") for k, v in obs.items()}
                    self.mesh = {"etcd_up": True, "nodes": nodes, "obs": {n: (v or {}).get("links", {}) for n, v in obs.items()},
                                 "route": {n: (v or {}).get("via", {}) for n, v in route.items()}}
                self.rebuild_cfg()
                if not self.log_loaded:
                    self._load_log(logdocs)
                self.read_quorum(m)
                return
            except Exception as ex:  # noqa: BLE001
                log.warning("mesh read via %s failed: %s", m["host"], ex)
        with self.lock:
            self.mesh["etcd_up"] = False

    def read_quorum(self, via: dict) -> None:
        """Health and leadership of every etcd member (asked from inside the overlay, through one member)."""
        eps = [m["client_url"] for m in self.members() if m.get("client_url")] or (self.cfg.get("mesh") or {}).get("etcd_endpoints") or []
        if not eps:
            return
        script = "; ".join(
            f"echo EP {ep}; {curl_etcd(self.cfg, ep, 3)[0]} {ep}/health; echo; {curl_etcd(self.cfg, ep, 3)[0]} -X POST {ep}/v3/maintenance/status -d '{{}}'; echo" for ep in eps)
        try:
            code, out, err = self.member_run(via, script, timeout=40)
        except Exception as ex:  # noqa: BLE001
            log.debug("quorum read failed: %s", ex)
            return
        by_overlay = {v.get("overlay"): n for n, v in self.mesh["nodes"].items() if v}
        members, cur = [], None
        for line in out.splitlines():
            if line.startswith("EP "):
                cur = {"endpoint": line[3:].strip(), "healthy": False, "leader": False}
                host = cur["endpoint"].split("//")[1].split(":")[0]
                cur["name"] = by_overlay.get(host, host)
                members.append(cur)
            elif cur is not None and line.strip().startswith("{"):
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                if "health" in d:
                    cur["healthy"] = d["health"] in ("true", True)
                elif "header" in d:
                    cur.update(raft_term=int(d.get("raftTerm", 0)), raft_index=int(d.get("raftIndex", 0)), db_size=int(d.get("dbSize", 0)),
                               version=d.get("version"), leader=d.get("leader") == d["header"].get("member_id"))
        healthy = sum(1 for m in members if m["healthy"])
        with self.lock:
            self.quorum = {"members": members, "size": len(members), "healthy": healthy,
                           "quorum": healthy >= len(members) // 2 + 1 if members else None,
                           "leader": next((m["name"] for m in members if m.get("leader")), None)}

    # ---- decisions -----------------------------------------------------
    def decide(self) -> None:
        if self.plane_state.get('mode') in ('pausing', 'resuming', 'removed', 'tearing_down'):
            return
        thr = self.cfg.get("ok_ratio", 0.67)
        for name, x in self.cfg["exits"].items():
            if not x.get("probe", True):
                continue
            st = self.state[name]
            d = exit_ok_from_entries(self.matrix, name, "direct", thr)
            w = exit_ok_from_entries(self.matrix, name, "wg", thr) if x.get("wg_ip") else None
            if d is not None:
                prev = st.direct.healthy
                st.direct.observe(d)
                if prev is not None and prev != st.direct.healthy:
                    self.event(f"{name}: direct path from entry nodes {'RECOVERED' if st.direct.healthy else 'FAILED'} ({self.evidence(name, 'direct')})",
                               "health", name)
            if w is not None:
                prev = st.wg.healthy
                st.wg.observe(w)
                if prev is not None and prev != st.wg.healthy:
                    self.event(f"{name}: overlay path {'healthy' if st.wg.healthy else 'failed'} ({self.evidence(name, 'wg')})",
                               "health", name)
        self.manage_balancer()
        self.manage_paths()
        self.manage_relays()
        self.manage_ips()
        if (self.cfg.get("mesh") or {}).get("etcd_tls"):
            try:
                self.refresh_etcd_control()
                self.resume_etcd_change()
            except Exception as ex:
                log.warning("etcd membership reconciliation failed: %s", ex)

    def event(self, msg: str, kind: str = "info", node: Optional[str] = None) -> None:
        """Decision / state log. Everything but plain 'info' is also kept in etcd for a week."""
        log.info(msg)
        now = time.time()
        ev = {"id": f"{int(now * 1000)}-{os.urandom(2).hex()}", "ts": int(now), "t": time.strftime("%Y-%m-%d %H:%M:%S"),
              "msg": msg, "kind": kind, "node": node}
        self.events.appendleft(ev)
        if kind != "info":
            threading.Thread(target=self._persist_event, args=(ev,), daemon=True).start()

    def _persist_event(self, ev: dict) -> None:
        try:
            import base64 as b
            lease = self.etcd_rpc("/lease/grant", {"TTL": 7 * 86400}).get("ID")
            self.etcd_rpc("/kv/put", {"key": b.b64encode(f"/mesh/log/{ev['id']}".encode()).decode(),
                                      "value": b.b64encode(json.dumps(ev).encode()).decode(), "lease": lease})
        except Exception as ex:  # noqa: BLE001
            log.debug("event not persisted: %s", ex)

    def _load_log(self, docs: Dict[str, dict]) -> None:
        """Merge decisions persisted by earlier runs (once per process)."""
        known = {e.get("id") for e in self.events}
        old = [d for k, d in docs.items() if d and k not in known]
        for d in sorted(old, key=lambda x: x.get("ts", 0)):
            self.events.appendleft(d)
        self.log_loaded = True

    def evidence(self, name: str, path: str) -> str:
        parts = []
        for en, d in self.matrix.items():
            r = d.get(name, {}).get(path)
            if r is not None:
                parts.append(f"{en} {int(r.ratio * 100)}%")
        return ", ".join(parts) or "no data"

    def manage_balancer(self) -> None:
        # Upstream has no balancer API. Never query it without an explicit integration.
        if not self.rw or not (self.cfg.get("balancer_uuid") or self.cfg.get("balancer_name")):
            return
        try:
            b = self.rw.balancer(uuid=self.cfg.get("balancer_uuid"), name=self.cfg.get("balancer_name"))
            self.balancer_error = None
            self.selected_balancer_uuid = b["uuid"]
        except Exception as ex:  # noqa: BLE001
            self.balancer_error = str(ex)
            self.balancer_state = {}
            log.warning("balancer read failed: %s", ex)
            return
        self.balancer_state = {n["nodeName"]: n["isDisabled"] for n in b["nodes"]}
        self.refresh_backend_routes()
        pinned = self.pinned()
        want: Dict[str, bool] = {}
        for name, x in self.cfg["exits"].items():
            node = x.get("rw_node")
            st = self.state[name]
            if x.get("balancer") is False:        # e.g. a probe-only duplicate of another exit
                continue
            healthy = (self.backend_routes.get(node, {}).get("healthy")
                       if self.cfg.get("balancer_routing_mode") == "mesh-fallback" else st.direct.healthy)
            if not node or node not in self.balancer_state or healthy is None:
                continue
            want[node] = True if node in pinned else not healthy
        diff = {n: v for n, v in want.items() if self.balancer_state.get(n) != v}
        if not diff:
            return
        if self.flag("auto_balancer"):
            try:
                self.rw.set_disabled(b, diff)
                self.event("balancer: " + ", ".join(f"{n} {'disabled' if v else 'enabled'}" for n, v in diff.items()) +
                           " (reachable path verified from entries)", "balancer")
            except Exception as ex:  # noqa: BLE001
                log.warning("balancer update failed: %s", ex)
        else:
            self.event("balancer (automation disabled) would: " + ", ".join(f"{n} {'disable' if v else 'enable'}" for n, v in diff.items()), "balancer")

    def manage_paths(self) -> None:
        for name, x in self.cfg["exits"].items():
            fwd = x.get("fwd")
            if not fwd:
                continue
            st = self.state[name]
            new = choose_path(st.direct.healthy, st.wg.healthy, st.path)
            if new == st.path:
                continue
            if not self.flag("auto_switch"):
                self.event(f"{name}: path {st.path} -> {new} (observe-only, not applied)")
                st.path = new
                continue
            target = x["public_ip"] if new == "direct" else x["wg_ip"]
            ok = True
            for en, e in self.cfg["entries"].items():
                if not self.ssh_ok.get(en):
                    continue
                sudo = "sudo -n " if e.get("sudo") else ""
                cmd = (f"{sudo}{fwd['script']} down; {sudo}sed -i 's/^{fwd['var']}=.*/{fwd['var']}={target}/' {fwd['script']}; "
                       f"{sudo}{fwd['script']} up; grep -c {target} <({sudo}iptables -t nat -S PREROUTING)")
                try:
                    code, out, err = self.ssh.run(e["host"], e["user"], f"bash -c \"{cmd}\"")
                    ok = ok and code == 0
                except Exception as ex:  # noqa: BLE001
                    ok = False
                    log.warning("switch %s on %s failed: %s", name, en, ex)
            self.event(f"{name}: relay path {st.path} -> {new} (applied={ok})", "path", name)
            st.path = new

    # ---- output --------------------------------------------------------
    def metrics(self) -> bytes:
        reg = CollectorRegistry()
        g_ok = Gauge("mesh_probe_ok_ratio", "share of successful TLS probes", ["entry", "exit", "path"], registry=reg)
        g_ms = Gauge("mesh_probe_ms", "worst TLS probe time, ms", ["entry", "exit", "path"], registry=reg)
        g_loc = Gauge("mesh_exit_alive_ratio", "TLS probe ratio from the cluster (abroad vantage)", ["exit"], registry=reg)
        g_ssh = Gauge("mesh_ssh_up", "entry reachable over ssh", ["entry"], registry=reg)
        g_h = Gauge("mesh_exit_healthy", "debounced health (1/0)", ["exit", "path"], registry=reg)
        g_bal = Gauge("mesh_balancer_disabled", "node disabled in Example-Balancer", ["node"], registry=reg)
        g_ts = Gauge("mesh_last_cycle_timestamp", "unix time of last finished cycle", registry=reg)
        g_etcd = Gauge("mesh_overlay_etcd_up", "overlay state readable from etcd", registry=reg)
        g_agent = Gauge("mesh_overlay_agent_up", "node agent published observations (lease alive)", ["node"], registry=reg)
        g_link = Gauge("mesh_overlay_link_ok", "overlay link seen healthy by 'from'", ["from_node", "to_node"], registry=reg)
        g_rtt = Gauge("mesh_overlay_link_rtt_ms", "overlay link rtt", ["from_node", "to_node"], registry=reg)
        g_quorum = Gauge("mesh_etcd_quorum", "etcd has a majority of healthy members (1/0)", registry=reg)
        g_qmem = Gauge("mesh_etcd_members_healthy", "healthy etcd members", registry=reg)
        g_relay = Gauge("mesh_relay_on", "relay through the overlay is active for the exit", ["exit"], registry=reg)
        g_via = Gauge("mesh_overlay_route_via", "destination reached through a transit", ["from_node", "dest", "via"], registry=reg)
        with self.lock:
            for en, data in self.matrix.items():
                for ex, paths in data.items():
                    for p, r in paths.items():
                        g_ok.labels(en, ex, p).set(r.ratio)
                        g_ms.labels(en, ex, p).set(r.ms)
            for ex, r in self.local.items():
                g_loc.labels(ex).set(r.ratio)
            for en, v in self.ssh_ok.items():
                g_ssh.labels(en).set(1 if v else 0)
            for ex, st in self.state.items():
                for p, h in (("direct", st.direct.healthy), ("wg", st.wg.healthy)):
                    if h is not None:
                        g_h.labels(ex, p).set(1 if h else 0)
            for n, v in self.balancer_state.items():
                g_bal.labels(n).set(1 if v else 0)
            g_ts.set(self.cycle_ts)
            g_etcd.set(1 if self.mesh["etcd_up"] else 0)
            for n in self.mesh["nodes"]:
                g_agent.labels(n).set(1 if n in self.mesh["obs"] else 0)
            for a, links in self.mesh["obs"].items():
                for b, v in links.items():
                    g_link.labels(a, b).set(1 if v.get("ok") else 0)
                    if v.get("rtt") is not None:
                        g_rtt.labels(a, b).set(v["rtt"])
            for n, r in self.relay_state.items():
                g_relay.labels(n).set(1 if r.get("on") else 0)
            if self.quorum.get("quorum") is not None:
                g_quorum.set(1 if self.quorum["quorum"] else 0)
            g_qmem.set(self.quorum.get("healthy", 0))
            for a, via in self.mesh["route"].items():
                for dest, t in via.items():
                    g_via.labels(a, dest, t).set(1)
        return generate_latest(reg)

    def compute_backend_routes(self) -> dict:
        return {x["rw_node"]: backend_route(x, self.state[n].direct.healthy, self.state[n].wg.healthy,
                                            self.mesh.get("nodes", {}).get(n, {}))
                for n, x in self.cfg["exits"].items() if x.get("rw_node") and x.get("balancer") is not False}

    def refresh_backend_routes(self) -> None:
        # Turning automation off freezes the last applied plan, including after
        # a controller restart. It must not put blocked public IPs back in HAProxy.
        if self.cfg.get("balancer_routing_mode") != "mesh-fallback" or not self.flag("auto_balancer"):
            return
        routes = self.compute_backend_routes()
        if routes == self.backend_routes and self.routes_owner_uuid == self.selected_balancer_uuid:
            return
        if self.routes_cache:
            self.routes_cache.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            tmp = self.routes_cache.with_suffix(".tmp")
            with open(tmp, "w", opener=lambda p, f: os.open(p, f, 0o600)) as stream:
                json.dump({"balancer_uuid": self.selected_balancer_uuid, "routes": routes}, stream)
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(tmp, self.routes_cache)
        previous = self.backend_routes
        self.backend_routes = routes
        self.routes_owner_uuid = self.selected_balancer_uuid
        changed = [f"{name}: {route['path']}" for name, route in routes.items()
                   if route.get("path") != previous.get(name, {}).get("path")]
        if changed:
            self.event("Balancer routes: " + ", ".join(changed), "balancer")

    def status(self) -> dict:
        with self.lock:
            return {
                "control_plane": {"mode": self.plane_state.get('mode', 'etcd'),
                    "desired_members": [record['name'] for record in self.plane_state.get('desired_members', [])],
                    "pending_cleanup": sorted((self.plane_state.get('cleanup_targets') or {}).keys())},
                "capabilities": {
                    "node_management": self.seed_path is not None,
                    "membership": self.seed_path is not None and bool((self.cfg.get("mesh") or {}).get("etcd_tls")),
                    "relay": self.rw is not None,
                    "ip_update": self.rw is not None,
                    "balancer": bool(self.cfg.get("balancer_uuid") or self.cfg.get("balancer_name")),
                },
                "cycles": self.cycles,
                "last_cycle": self.cycle_ts,
                "auto_balancer": bool(self.flag("auto_balancer")),
                "auto_switch": bool(self.flag("auto_switch")),
                "auto_relay": bool(self.flag("auto_relay")),
                "auto_ip_update": bool(self.flag("auto_ip_update")),
                "relays": {n: {"on": bool(r.get("on")), "since": r.get("since"), "reason": r.get("reason"), "hosts": len(r.get("saved") or []), "pending": bool(r.get("operation")), "target": (r.get("operation") or {}).get("target")}
                           for n, r in self.relay_state.items()},
                "relay_capable": sorted(n for n, x in self.cfg["exits"].items()
                                        if x.get("relay") != "legacy" and x.get("relay_slot") is not None and x.get("wg_ip") and x.get("rw_node")),
                "inventory": {n: {"role": v.get("role"), "host": v.get("host"), "overlay": v.get("overlay"), "rw_node": v.get("rw_node")}
                              for n, v in self.inventory.items()},
                "jobs": sorted(self.jobs.values(), key=lambda j: -j["t0"])[:5],
                "pinned_disabled": sorted(self.pinned()),
                "exits_nodes": {n: x.get("rw_node") for n, x in self.cfg["exits"].items()},
                "entries_ssh": self.ssh_ok,
                "exits": {
                    n: {
                        "direct_healthy": s.direct.healthy,
                        "wg_healthy": s.wg.healthy,
                        "path": s.path,
                        "from_cluster": self.local[n].ratio if n in self.local else None,
                        "per_entry": {en: {p: round(r.ratio, 2) for p, r in d.get(n, {}).items()} for en, d in self.matrix.items()},
                    } for n, s in self.state.items()
                },
                "balancer_disabled": self.balancer_state,
                "balancer_error": self.balancer_error,
                "balancer_selector": self.cfg.get("balancer_uuid") or self.cfg.get("balancer_name"),
                "balancer_uuid": self.selected_balancer_uuid if self.routes_owner_uuid == self.selected_balancer_uuid else None,
                "balancer_routing_mode": self.cfg.get("balancer_routing_mode", "direct"),
                "balancer_routes": self.backend_routes,
                "relay_modes": {n: self.relay_mode(n) for n in self.cfg["exits"]},
                "overlay": self.mesh,
                "quorum": self.quorum,
                "etcd_mtls": bool((self.cfg.get("mesh") or {}).get("etcd_tls")),
                "etcd_operation": self.control.get("operation"),
                "topology": {"nodes": [
                    {"name": n, "role": "entry" if n in self.cfg["entries"] else "exit", "overlay": (v or {}).get("overlay"),
                     "underlay": (v or {}).get("underlay"), "etcd": any(m["name"] == n for m in self.quorum["members"]),
                     "leader": self.quorum.get("leader") == n,
                     "agent_age": (int(time.time()) - self.agent_ts[n]) if self.agent_ts.get(n) else None,
                     "relay": bool((self.relay_state.get(n) or {}).get("on")),
                     "added": n in self.inventory}
                    for n, v in sorted(self.mesh["nodes"].items())]},
                "events": list(self.events)[:50],
            }



def serve(mesh: Mesh, port: int) -> None:
    class H(BaseHTTPRequestHandler):
        def _authorized(self):
            token = os.environ.get("MESH_API_TOKEN", "")
            return bool(token and hmac.compare_digest(self.headers.get("X-Mesh-Token", ""), token))

        def do_GET(self):  # noqa: N802
            if self.path == "/metrics":
                body, ct = mesh.metrics(), "text/plain; version=0.0.4"
            elif self.path == "/status":
                if not self._authorized():
                    return self._json(403, {"error": "forbidden"})
                body, ct = json.dumps(mesh.status(), ensure_ascii=False).encode(), "application/json"
            elif self.path == "/healthz":
                body, ct = b"ok", "text/plain"
            elif self.path.startswith("/api/jobs/"):
                tok = os.environ.get("MESH_API_TOKEN", "")
                if not tok or not hmac.compare_digest(self.headers.get("X-Mesh-Token", ""), tok):
                    return self._json(403, {"error": "forbidden"})
                job = mesh.jobs.get(self.path.rsplit("/", 1)[1])
                return self._json(200 if job else 404, job or {"error": "no such job"})
            else:
                return self._json(404, {"error": "not found"})
            self.send_response(200)
            self.send_header("Content-Type", ct)
            self.end_headers()
            self.wfile.write(body)

        def _json(self, code: int, obj: dict) -> None:
            body = json.dumps(obj, ensure_ascii=False).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):  # noqa: N802
            tok = os.environ.get("MESH_API_TOKEN", "")
            if not tok or not hmac.compare_digest(self.headers.get("X-Mesh-Token", ""), tok):
                return self._json(403, {"error": "forbidden"})
            try:
                n = int(self.headers.get("Content-Length", "0"))
                if n < 0 or n > 65536:
                    return self._json(413, {"error": "request too large"})
                data = json.loads(self.rfile.read(n) or b"{}")
                if not isinstance(data, dict):
                    return self._json(400, {"error": "expected object"})
            except Exception:  # noqa: BLE001
                return self._json(400, {"error": "bad json"})
            try:
                if self.path == "/api/teardown":
                    if data.get('confirm') != 'REMOVE_MESH':
                        return self._json(400, {"error": "explicit full mesh removal confirmation is required"})
                    job = mesh.start_teardown()
                    return self._json(202, {"job": job['id']})
                if self.path == "/api/flags":
                    return self._json(200, {"flags": mesh.save_flags(data)})
                if self.path == "/api/nodes":              # add a node (credentials are used once, never stored)
                    try:
                        job = mesh.start_onboard(data)
                    except (ValueError, RuntimeError) as ex:
                        return self._json(400, {"error": str(ex)})
                    return self._json(202, {"job": job["id"]})
                if self.path == "/api/nodes/remove":
                    try:
                        job = mesh.start_remove(str(data.get("name", "")))
                    except ValueError as ex:
                        return self._json(400, {"error": str(ex)})
                    return self._json(202, {"job": job["id"]})
                if self.path == "/api/relay":
                    try:
                        mode = data.get("mode")
                        if mode is None and isinstance(data.get("on"), bool):
                            mode = "relay" if data["on"] else "direct"
                        flags = mesh.set_relay_mode(str(data.get("exit", "")), mode)
                    except (ValueError, RuntimeError) as ex:
                        return self._json(400, {"error": str(ex)})
                    return self._json(202, {"flags": flags, "status": "accepted"})
                if self.path == "/api/etcd":
                    try:
                        job = mesh.start_etcd_change(str(data.get("name", "")), data.get("member"))
                    except (ValueError, RuntimeError) as ex:
                        return self._json(400, {"error": str(ex)})
                    return self._json(202, {"job": job["id"]})
                if self.path == "/api/probe":
                    mesh.wake.set()
                    return self._json(200, {"ok": True})
                if self.path == "/api/pin":            # {"node": "Example-Exit", "pinned": true}
                    cur = set(mesh.flags.get("pin_disabled", []))
                    (cur.add if data.get("pinned") else cur.discard)(data.get("node"))
                    return self._json(200, {"flags": mesh.save_flags({"pin_disabled": sorted(cur)})})
            except Exception as ex:  # noqa: BLE001
                return self._json(502, {"error": str(ex)})
            return self._json(404, {"error": "not found"})

        def log_message(self, *a):  # silence
            pass

    class Server(ThreadingHTTPServer):
        def get_request(self):
            connection, address = super().get_request()
            connection.settimeout(10)
            return connection, address
    Server(("0.0.0.0", port), H).serve_forever()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    cfg = yaml.safe_load(open(os.environ.get("MESHCTL_CONFIG", "/config/config.yaml")))
    ssh = Ssh(os.environ.get("MESHCTL_KEY", "/secrets/id_ed25519"), cfg.get("ssh_jumps"))
    tok = os.environ.get("REMNAWAVE_API_TOKEN")
    if tok and not os.environ.get("REMNAWAVE_URL"):
        raise ValueError("REMNAWAVE_URL is required when REMNAWAVE_API_TOKEN is set")
    rw = Rw(os.environ["REMNAWAVE_URL"], tok) if tok else None
    mesh = Mesh(cfg, ssh, rw)
    threading.Thread(target=serve, args=(mesh, int(os.environ.get("PORT", "8080"))), daemon=True).start()
    while True:
        t0 = time.time()
        try:
            mesh.probe_all()
            mesh.read_mesh()
            mesh.decide()
        except Exception:  # noqa: BLE001
            log.exception("cycle failed")
        mesh.wake.wait(max(5, cfg.get("interval", 60) - (time.time() - t0)))
        mesh.wake.clear()


if __name__ == "__main__":
    main()

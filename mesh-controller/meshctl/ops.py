"""Operations of the mesh controller that change things: etcd writes, relays, IP changes, onboarding.

A mixin for `Mesh` (app.py). Everything that touches production is behind a flag in /mesh/flags/main:
  auto_relay      move a dead exit's hosts to a relay through the overlay (and back)
  auto_ip_update  follow a node's new public IP in DNS / Remnawave / the mesh
Explicit actions from the panel (add node, remove node, force relay) always run.
"""
from __future__ import annotations

import base64
import copy
import hashlib
import json
import logging
import os
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional

import paramiko
import requests

from .etcd_members import EtcdMembers
from .transport import curl_etcd
from .journal import prepare_enable, prepare_restore, host_patches
from .ipwatch import IpWatch
from .onboard import allocate_overlay, validate_host, validate_name
from .relay import forward_rules, host_rewrites, host_restores, next_slot, wants_relay

log = logging.getLogger("meshctl")

AGENT_DIR = Path(__file__).resolve().parent.parent / "agent"
LIB = "/usr/local/lib/meshagent"
FWD_UNIT = """[Unit]
Description=mesh relay forwards (DNAT through the overlay)
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/python3 /usr/local/sbin/meshfwd.py apply

[Install]
WantedBy=multi-user.target
"""
AGENT_UNIT = """[Unit]
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
ETCD_PREFIXES = ["/mesh/nodes/", "/mesh/obs/", "/mesh/route/", "/mesh/flags/", "/mesh/inventory/", "/mesh/relay/", "/mesh/ipmap/", "/mesh/log/", "/mesh/control/"]


def b64(s: str) -> str:
    return base64.b64encode(s.encode()).decode()


def shq(s: str) -> str:
    return "'" + s.replace("'", "'\"'\"'") + "'"


class Ops(EtcdMembers):
    # attributes provided by Mesh: cfg, base_cfg, ssh, rw, lock, state, mesh, flags, event(), wake

    def init_ops(self) -> None:
        self.init_etcd_control()
        self.base_cfg = copy.deepcopy(self.cfg)
        self.inventory: Dict[str, dict] = {}
        self.relay_state: Dict[str, dict] = {}
        self.ipmap: Dict[str, dict] = {}
        self.reported_ip: Dict[str, str] = {}
        self.ipwatch = IpWatch(need=3)
        self.jobs: Dict[str, dict] = {}
        self.fwd_installed: Dict[str, str] = {}      # entry -> sha of the script we pushed
        self.relay_lock = threading.RLock()
        self.flags_lock = threading.RLock()
        self.relay_generation = 0
        self.flags_generation = 0
        self.relay_pending: Dict[str, tuple] = {}

    # ---- etcd through a member ----------------------------------------
    def members(self) -> List[dict]:
        records = (self.control.get("etcd") or {}).get("members")
        return [{**m, "host": (self.ipmap.get(m["name"]) or {}).get("ip") or m["host"]} for m in records] if records else (self.cfg.get("mesh") or {}).get("read_via", [])

    def member_run(self, member, command, stdin=None, timeout=30):
        """Member certificates are root-only, including on sudo-based SSH accounts."""
        command = ('sudo -n ' if member.get('sudo') else '') + 'bash -c ' + shq(command)
        return self.ssh.run(member['host'], member.get('user', 'root'), command, stdin=stdin, timeout=timeout)

    def etcd_rpc(self, path: str, body: dict) -> dict:
        last = None
        curl, endpoint = curl_etcd(self.cfg)
        for m in self.members():
            try:
                code, out, err = self.member_run(m, f"{curl} -X POST {endpoint}/v3{path} -d @-",
                                                stdin=json.dumps(body), timeout=25)
                if code == 0:
                    return json.loads(out or "{}")
                last = err
            except Exception as ex:  # noqa: BLE001
                last = ex
        raise RuntimeError(f"etcd unreachable: {last}")

    def etcd_put(self, key: str, value: dict) -> None:
        self.etcd_rpc("/kv/put", {"key": b64(key), "value": b64(json.dumps(value))})

    def etcd_del(self, key: str, prefix: bool = False) -> None:
        body = {"key": b64(key)}
        if prefix:
            body["range_end"] = b64(key[:-1] + chr(ord(key[-1]) + 1))
        self.etcd_rpc("/kv/deleterange", body)

    # ---- effective configuration = static config + etcd inventory + ip overrides ----
    def rebuild_cfg(self) -> None:
        cfg = copy.deepcopy(self.base_cfg)
        for name, d in self.ipmap.items():
            ip = d.get("ip")
            if not ip:
                continue
            if name in cfg["entries"]:
                cfg["entries"][name]["host"] = ip
            if name in cfg["exits"]:
                cfg["exits"][name]["public_ip"] = ip
            for m in (cfg.get("mesh") or {}).get("read_via", []):
                if m.get("name") == name:
                    m["host"] = ip
        for name, inv in self.inventory.items():
            ip = (self.ipmap.get(name) or {}).get("ip") or inv.get("host")
            if inv.get("role") == "entry":
                cfg["entries"][name] = {"host": ip, "user": inv.get("user", "root"), "sudo": bool(inv.get("sudo"))}
            else:
                cfg["exits"][name] = {"public_ip": ip, "rw_node": inv.get("rw_node"), "wg_ip": inv.get("overlay"),
                                      "relay_slot": inv.get("slot")}
        from .core import ExitState
        for n in cfg["exits"]:
            self.state.setdefault(n, ExitState())
        self.cfg = cfg

    # ---- relays ---------------------------------------------------------
    def entry_run(self, name: str, cmd: str, stdin: Optional[str] = None, timeout: int = 60):
        e = self.cfg["entries"][name]
        sudo = "sudo -n " if e.get("sudo") else ""
        return self.ssh.run(e["host"], e["user"], f"{sudo}bash -c {shq(cmd)}", stdin=stdin, timeout=timeout)

    def push_meshfwd(self, rules: List[dict]) -> bool:
        """Write rules.json on every reachable entry and apply it. Installs the script on first use."""
        script = (AGENT_DIR / "meshfwd.py").read_text()
        sha = hashlib.sha256((script + FWD_UNIT).encode()).hexdigest()[:12]
        payload = json.dumps({"rules": rules}, indent=1)
        ok_all = True
        for name in self.cfg["entries"]:
            if not self.ssh_ok.get(name):
                ok_all = False
                continue
            try:
                if self.fwd_installed.get(name) != sha:
                    self.entry_run(name, "mkdir -p /etc/meshfwd && cat > /usr/local/sbin/meshfwd.py && chmod 755 /usr/local/sbin/meshfwd.py", stdin=script)
                    self.entry_run(name, "cat > /etc/systemd/system/meshfwd.service", stdin=FWD_UNIT)
                    self.entry_run(name, "systemctl daemon-reload && systemctl enable meshfwd >/dev/null 2>&1")
                    self.fwd_installed[name] = sha
                self.entry_run(name, "mkdir -p /etc/meshfwd && cat > /etc/meshfwd/rules.json", stdin=payload)
                code, out, err = self.entry_run(name, "python3 /usr/local/sbin/meshfwd.py apply")
                if code != 0:
                    ok_all = False
                    log.warning("meshfwd apply on %s failed: %s", name, err.strip()[:200])
            except Exception as ex:  # noqa: BLE001
                ok_all = False
                log.warning("meshfwd push to %s failed: %s", name, ex)
        return ok_all

    def active_rules(self, extra_on: Optional[str] = None, extra_off: Optional[str] = None) -> List[dict]:
        rules = []
        for name, x in self.cfg["exits"].items():
            state = self.relay_state.get(name) or {}
            on = bool(state.get("on") or (state.get("operation") or {}).get("target"))
            if name == extra_on:
                on = True
            if name == extra_off:
                on = False
            if on and x.get("wg_ip") and x.get("relay_slot") is not None:
                rules.append({"id": name, "target": x["wg_ip"], "maps": forward_rules(x["relay_slot"])})
        return rules

    def relay_mode(self, name: str) -> str:
        return (self.flags.get("relay_modes") or {}).get(name, "auto")

    def set_relay_mode(self, name: str, mode: str) -> dict:
        if name not in self.cfg["exits"] or mode not in ("auto", "direct", "relay"):
            raise ValueError("known exit and mode auto/direct/relay are required")
        x = self.cfg["exits"][name]
        if x.get("relay") == "legacy" or x.get("relay_slot") is None or not x.get("wg_ip") or not x.get("rw_node"):
            raise ValueError("this exit is not managed by the overlay relay controller")
        flags = self.save_flags({"relay_modes": {name: mode}})
        # Return the durable intent immediately; SSH/host changes can exceed the panel timeout.
        if mode != "auto":
            threading.Thread(target=self._apply_manual_mode, args=(name, mode), daemon=True).start()
        return flags

    def _apply_manual_mode(self, name: str, mode: str) -> None:
        try:
            self.set_relay(name, mode == "relay", reason="manual", expected_mode=mode)
        except Exception as ex:
            self.event(f"{name}: mode saved; switch will be retried: {ex}", "relay", name)

    def manage_relays(self) -> None:
        for name, x in list(self.cfg["exits"].items()):
            st = self.state.get(name)
            if st is None:
                continue
            mode = self.relay_mode(name)
            pending = bool((self.relay_state.get(name) or {}).get("operation"))
            want = wants_relay(x, st.direct.healthy, st.wg.healthy) if mode == "auto" else mode == "relay"
            cur = bool((self.relay_state.get(name) or {}).get("on"))
            # Finish an interrupted journal even when automatic switching has since been disabled.
            if pending:
                try:
                    self.set_relay(name, cur if want is None else want, reason="recovery", expected_mode=mode,
                                   recover_only=mode == "auto" and not self.flag("auto_relay"))
                except Exception as ex:
                    self.event(f"{name}: switch recovery is incomplete: {ex}", "relay", name)
                continue
            if want is None or want == cur:
                self.relay_pending.pop(name, None)
                continue
            if mode == "auto":
                prev, n = self.relay_pending.get(name, (want, 0))
                n = n + 1 if prev == want else 1
                self.relay_pending[name] = (want, n)
                if n < 2:
                    continue
                if not self.flag("auto_relay"):
                    self.event(f"{name}: relay would be {'ENABLED' if want else 'DISABLED'} (automation disabled)", "relay", name)
                    continue
            try:
                self.set_relay(name, want, reason="auto" if mode == "auto" else "manual", expected_mode=mode)
                self.relay_pending.pop(name, None)
            except Exception as ex:
                self.event(f"{name}: switch will be retried: {ex}", "relay", name)

    def _relay_store(self, name: str, state: dict) -> None:
        # The durable write is first. A failed write must never authorize side effects.
        self.etcd_put(f"/mesh/relay/{name}", state)
        self.relay_state[name] = copy.deepcopy(state)
        self.relay_generation += 1

    def _relay_load(self) -> None:
        data = self.etcd_rpc("/kv/range", {"key": b64("/mesh/relay/"), "range_end": b64("/mesh/relay0")})
        self.relay_state = {base64.b64decode(k["key"]).decode().rsplit("/", 1)[1]:
                            json.loads(base64.b64decode(k["value"])) for k in data.get("kvs", [])}
        self.relay_generation += 1

    def _relay_finish(self, name: str, current: dict) -> dict:
        state = copy.deepcopy(current)
        op = state["operation"]
        on = op["target"]
        if on and not self.push_meshfwd(self.active_rules(extra_on=name)):
            raise RuntimeError("could not apply forwards on all entries; saved plan retained")
        # Every patch is repeatable after a process crash or a lost API response.
        for patch in host_patches(op["hosts"], self.rw.req("GET", "/api/hosts"), on):
            self.rw.req("PATCH", "/api/hosts", patch)
        if host_patches(op["hosts"], self.rw.req("GET", "/api/hosts"), on):
            raise RuntimeError("host changes are not visible yet; saved plan retained")
        # When disabling, keep forwarding until all hosts have been restored.
        if not on and not self.push_meshfwd(self.active_rules(extra_off=name)):
            raise RuntimeError("host addresses restored but forward cleanup must be retried")
        state.update(on=on, saved=state.get("saved", []) if on else [], since=int(time.time()), reason=op["reason"])
        state.pop("operation", None)
        self._relay_store(name, state)
        self.event(f"{name}: relay {'ENABLED' if on else 'DISABLED'}; switch journal committed", "relay", name)
        return state

    def set_relay(self, name: str, on: bool, reason: str = "manual", expected_mode=None, recover_only=False) -> dict:
        x = self.cfg["exits"].get(name)
        if not x or x.get("relay") == "legacy" or x.get("relay_slot") is None or not x.get("wg_ip") or not x.get("rw_node"):
            raise ValueError("exit has no managed relay slot / overlay address / Remnawave node")
        if not self.rw:
            raise RuntimeError("Remnawave API is not configured")
        with self.relay_lock:
            if expected_mode is not None and self.relay_mode(name) != expected_mode:
                return self.relay_state.get(name) or {"on": False}
            self._relay_load()  # never build a forwarding plan from a stale status snapshot
            current = self.relay_state.get(name) or {"on": False, "saved": []}
            if current.get("operation"):
                current = self._relay_finish(name, current)
            if recover_only or bool(current.get("on")) == on:
                return current
            address = self.cfg.get("relay_address", "relay.example.com")
            saved = current.get("saved") or []
            if on:
                nodes = [n for n in self.rw.req("GET", "/api/nodes") if n["name"] == x["rw_node"]]
                if len(nodes) != 1:
                    raise RuntimeError("relay node is missing or ambiguous")
                plans, saved = prepare_enable(self.rw.req("GET", "/api/hosts"), nodes[0]["uuid"], address, x["relay_slot"], saved)
                if not plans:
                    raise RuntimeError("no eligible direct hosts; refusing to enable an untracked relay")
            else:
                plans = prepare_restore(saved, address, x["relay_slot"])
            state = dict(current, saved=saved, slot=x["relay_slot"], operation={"target": on, "hosts": plans, "reason": reason})
            self._relay_store(name, state)  # originals are durable BEFORE iptables or Remnawave changes
            return self._relay_finish(name, state)

    # ---- IP changes -----------------------------------------------------
    def manage_ips(self) -> None:
        registered = {n: v.get("underlay") for n, v in self.mesh["nodes"].items() if v and v.get("underlay")}
        for name, old, new in self.ipwatch.observe(registered, self.reported_ip):
            if not self.flag("auto_ip_update"):
                self.event(f"{name}: public IP changed {old} -> {new} (tracking disabled)", "ip", name)
                continue
            try:
                self.handle_ip_change(name, old, new)
            except Exception as ex:  # noqa: BLE001
                self.event(f"{name}: IP change {old} -> {new}: error {ex}", "ip", name)
                log.exception("ip change failed")

    def cloudflare_update(self, old: str, new: str) -> List[str]:
        token, zone = os.environ.get("CF_API_TOKEN"), self.cfg.get("cloudflare_zone")
        if not token or not zone:
            return []
        h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        base = "https://api.cloudflare.com/client/v4"
        z = requests.get(f"{base}/zones", params={"name": zone}, headers=h, timeout=20).json()["result"][0]["id"]
        done = []
        recs = requests.get(f"{base}/zones/{z}/dns_records", params={"per_page": 200, "content": old, "type": "A"}, headers=h, timeout=20).json()["result"]
        for r in recs:
            requests.patch(f"{base}/zones/{z}/dns_records/{r['id']}", json={"content": new}, headers=h, timeout=20).raise_for_status()
            done.append(r["name"])
        return done

    def handle_ip_change(self, name: str, old: str, new: str) -> None:
        steps = []
        node_doc = dict(self.mesh["nodes"].get(name) or {})
        node_doc["underlay"] = new
        self.etcd_put(f"/mesh/nodes/{name}", node_doc)
        self.etcd_put(f"/mesh/ipmap/{name}", {"ip": new, "old": old, "ts": int(time.time())})
        self.ipmap[name] = {"ip": new, "old": old}
        self.rebuild_cfg()
        steps.append("mesh")
        rw_name = (self.cfg["exits"].get(name) or self.cfg["entries"].get(name) or {}).get("rw_node")
        if self.rw and rw_name:
            node = next((n for n in self.rw.req("GET", "/api/nodes") if n["name"] == rw_name), None)
            if node and node.get("address") == old:
                self.rw.req("PATCH", "/api/nodes", {"uuid": node["uuid"], "address": new})
                steps.append(f"remnawave node {rw_name}")
        try:
            names = self.cloudflare_update(old, new)
            if names:
                steps.append("dns " + ", ".join(names))
        except Exception as ex:  # noqa: BLE001
            steps.append(f"dns FAILED ({ex})")
        self.event(f"{name}: public IP {old} -> {new}; updated: {'; '.join(steps)}", "ip", name)

    # ---- jobs: add / remove a node ---------------------------------------
    def new_job(self, kind: str, title: str) -> dict:
        job = {"id": uuid.uuid4().hex[:10], "kind": kind, "title": title, "status": "running", "steps": [], "error": None, "t0": int(time.time())}
        with self.lock:
            self.jobs[job["id"]] = job
            for jid in sorted(self.jobs, key=lambda j: self.jobs[j]["t0"])[:-20]:
                self.jobs.pop(jid, None)
        return job

    @staticmethod
    def step(job: dict, text: str) -> None:
        job["steps"].append({"t": time.strftime("%H:%M:%S"), "text": text})

    def start_onboard(self, req: dict) -> dict:
        """Validate and start adding a node. Credentials are used in memory only and never logged or stored."""
        name, host = str(req.get("name", "")), str(req.get("host", ""))
        role = req.get("role", "exit")
        if role not in ("exit", "entry"):
            raise ValueError("role must be exit or entry")
        if req.get("etcd") and self.seed_path is None:
            raise ValueError("a persistent state directory is required for etcd membership")
        if req.get("etcd") and not (self.cfg.get("mesh") or {}).get("etcd_tls"):
            raise ValueError("complete the etcd mTLS migration first")
        taken = set(self.mesh["nodes"]) | set(self.cfg["entries"]) | set(self.cfg["exits"])
        err = validate_name(name, taken) or validate_host(host)
        if err:
            raise ValueError(err)
        if not (req.get("password") or req.get("private_key")):
            raise ValueError("password or private_key is required")
        if not self.mesh["etcd_up"]:
            raise RuntimeError("etcd is not reachable, cannot register the node")
        job = self.new_job("add-node", f"add node {name} ({host})")
        secret = {"password": req.get("password"), "private_key": req.get("private_key")}
        threading.Thread(target=self._onboard_run, args=(job, name, host, str(req.get("user") or "root"), role, req.get("rw_node") or None, secret, bool(req.get("etcd"))), daemon=True).start()
        return job

    def _onboard_run(self, job: dict, name: str, host: str, user: str, role: str, rw_node: Optional[str], secret: dict, want_etcd: bool = False) -> None:
        sensitive = [value for value in secret.values() if value]
        c = None
        try:
            # 1. first contact with the one-time credentials
            c = paramiko.SSHClient()
            c.load_host_keys(self.ssh.known_hosts)
            c.set_missing_host_key_policy(paramiko.RejectPolicy())
            kw = dict(hostname=host, port=22, username=user, timeout=15, banner_timeout=20, auth_timeout=20, allow_agent=False, look_for_keys=False)
            if secret.get("private_key"):
                import io
                pkey = None
                for cls in (paramiko.Ed25519Key, paramiko.RSAKey, paramiko.ECDSAKey):
                    try:
                        pkey = cls.from_private_key(io.StringIO(secret["private_key"]))
                        break
                    except Exception:  # noqa: BLE001
                        continue
                if pkey is None:
                    raise ValueError("private key could not be parsed")
                kw["pkey"] = pkey
            else:
                kw["password"] = secret["password"]
            c.connect(**kw)
            self.step(job, f"connected to {host} as {user}")
            sudo = "" if user == "root" else "sudo -n "

            def rexec(cmd: str, stdin: Optional[str] = None, timeout: int = 180):
                i, o, e = c.exec_command(f"{sudo}bash -c {shq(cmd)}", timeout=timeout)
                if stdin is not None:
                    i.write(stdin)
                    i.channel.shutdown_write()
                out, err = o.read().decode(errors="replace"), e.read().decode(errors="replace")
                return o.channel.recv_exit_status(), out, err

            # 2. let the controller in with its own key, then drop the credentials
            pub = f"ssh-ed25519 {self.ssh.key.get_base64()} remnawave-mesh-controller"
            account = shq(user)
            code, out, err = rexec(
                f"LOGIN_HOME=$(getent passwd {account} | cut -d: -f6); test -n \"$LOGIN_HOME\" && "
                f"mkdir -p \"$LOGIN_HOME/.ssh\" && chmod 700 \"$LOGIN_HOME/.ssh\" && "
                f"(grep -qF {shq(pub)} \"$LOGIN_HOME/.ssh/authorized_keys\" 2>/dev/null || "
                f"echo {shq(pub)} >> \"$LOGIN_HOME/.ssh/authorized_keys\") && "
                f"chmod 600 \"$LOGIN_HOME/.ssh/authorized_keys\" && "
                f"chown {account}:$(id -gn {account}) \"$LOGIN_HOME/.ssh\" \"$LOGIN_HOME/.ssh/authorized_keys\"")
            if code != 0:
                raise RuntimeError(f"cannot install the controller key: {err.strip()[:200]}")
            c.close()
            secret.clear()
            code, out, err = self.ssh.run(host, user, "true", timeout=30)
            if code != 0:
                raise RuntimeError("login with the controller key does not work")
            self.step(job, "controller key installed, credentials discarded")

            from .provision import Node, pubkey
            node = Node(name, {"host": host, "user": user, "sudo": user != "root"}, self.ssh)
            # 3. dependencies
            node.run("for b in python3 wg iptables ip; do command -v $b >/dev/null || NEED=1; done; "
                     "if [ -n \"$NEED\" ]; then DEBIAN_FRONTEND=noninteractive apt-get update -qq && "
                     "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wireguard-tools python3 iptables iproute2 >/dev/null; fi; "
                     "command -v python3 wg iptables ip >/dev/null", timeout=600)
            self.step(job, "python3, wireguard-tools, iptables are in place")
            # 4. keys and the overlay address
            pk = pubkey(node)
            used = [v.get("overlay") for v in self.mesh["nodes"].values() if v and v.get("overlay")]
            overlay = allocate_overlay(used, role)
            if not overlay:
                raise RuntimeError("no free overlay addresses left")
            self.step(job, f"overlay address {overlay}")
            # 5. register, then install: the other agents pick the node up from etcd within a few seconds
            entry = {"underlay": host, "overlay": overlay, "pubkey": pk, "prio": 0}
            slots = {v.get("slot") for v in self.inventory.values() if v.get("slot") is not None} | \
                    {x.get("relay_slot") for x in self.cfg["exits"].values() if x.get("relay_slot") is not None}
            inv = {"role": role, "host": host, "user": user, "sudo": user != "root", "overlay": overlay, "rw_node": rw_node,
                   "slot": next_slot(slots) if role == "exit" else None, "added": int(time.time())}
            seed = {n: v for n, v in self.mesh["nodes"].items() if v}
            seed[name] = entry
            endpoints = [m['client_url'] for m in self.members() if m.get('client_url')] or (self.cfg.get("mesh") or {}).get("etcd_endpoints") or []
            self.install_agent(node, name, overlay, seed, endpoints)
            self.step(job, "agent installed and started")
            self.etcd_put(f"/mesh/nodes/{name}", entry)
            self.etcd_put(f"/mesh/inventory/{name}", inv)
            self.inventory[name] = inv
            self.rebuild_cfg()
            self.step(job, "registered in etcd; the other nodes are connecting")
            # 6. wait until the node sees its peers
            deadline = time.time() + 150
            seen = 0
            while time.time() < deadline:
                self.read_mesh()
                links = self.mesh["obs"].get(name) or {}
                seen = sum(1 for v in links.values() if v.get("ok"))
                if seen >= max(1, (len(seed) - 1) // 2):
                    break
                time.sleep(5)
            if seen == 0:
                raise RuntimeError("the node joined but sees no peers yet (check UDP 52000+ is not blocked for it)")
            self.step(job, f"{seen} overlay links are up")
            self.event(f"node {name} ({host}, {role}) added to mesh, overlay {overlay}", "node", name)
            if want_etcd:
                self.step(job, "Installing etcd and joining as a learner")
                with self.etcd_lock:
                    if self.etcd_running:
                        raise RuntimeError("mesh added; assign etcd membership after the pending membership change finishes")
                    self.etcd_running = True
                    try: self.change_etcd(name, True, job)
                    finally: self.etcd_running = False
            job["status"] = "done"
        except Exception as ex:  # noqa: BLE001
            msg = str(ex)
            for value in sensitive:
                msg = msg.replace(value, "***")
            job["error"] = msg[:400]
            job["status"] = "failed"
            self.step(job, f"FAILED: {job['error']}")
            self.event(f"adding node {name} failed: {job['error']}", "node", name)
            log.warning("onboarding %s failed: %s", name, job["error"])
        finally:
            secret.clear()
            sensitive.clear()
            if c is not None:
                c.close()

    def install_agent(self, node, name: str, overlay: str, seed: dict, endpoints: List[str]) -> None:
        agent = (AGENT_DIR / "meshagent.py").read_text()
        routing = (Path(__file__).resolve().parent / "routing.py").read_text()
        node.put(f"{LIB}/meshagent.py", agent, "755")
        node.put(f"{LIB}/routing.py", routing)
        node.put("/etc/meshagent/nodes.json", json.dumps(seed, indent=1), "600")
        config = {"name": name, "overlay": overlay, "key_file": "/etc/wireguard/wgmesh.key",
                  "etcd": endpoints, "nodes_file": "/etc/meshagent/nodes.json", "routing_policy": "quality"}
        tls = (self.cfg.get("mesh") or {}).get("etcd_tls")
        if tls:
            from .pki import issue
            issuer = (self.cfg.get("mesh") or {}).get("pki") or {}
            ca = Path(issuer.get("ca_file", "/etcd-tls/ca.crt")).read_text()
            ca_key = Path(issuer.get("ca_key_file", "/etcd-tls/ca.key")).read_text()
            cert, key = issue(ca, ca_key, "mesh-agent-" + name)
            for path, content in [(tls["ca_file"], ca), (tls["cert_file"], cert), (tls["key_file"], key)]:
                node.put(path, content, "600")
            config["etcd_tls"] = tls
        node.put("/etc/meshagent/config.json", json.dumps(config, indent=1), "600")
        node.put("/etc/systemd/system/meshagent.service", AGENT_UNIT.format(lib=LIB))
        node.run("systemctl daemon-reload && systemctl enable meshagent >/dev/null 2>&1 && systemctl restart meshagent")

    def start_remove(self, name: str) -> dict:
        if name in {m["name"] for m in self.members()}:
            raise ValueError("remove the node from etcd membership first")
        if name not in self.inventory:
            raise ValueError("only nodes added from the panel can be removed here")
        job = self.new_job("remove-node", f"remove node {name}")
        threading.Thread(target=self._remove_run, args=(job, name), daemon=True).start()
        return job

    def _remove_run(self, job: dict, name: str) -> None:
        try:
            inv = self.inventory[name]
            if (self.relay_state.get(name) or {}).get("on"):
                self.set_relay(name, False, reason="node removed")
            for key in (f"/mesh/nodes/{name}", f"/mesh/inventory/{name}", f"/mesh/obs/{name}", f"/mesh/route/{name}", f"/mesh/relay/{name}", f"/mesh/ipmap/{name}"):
                self.etcd_del(key)
            self.step(job, "removed from etcd; the other nodes drop their links to it")
            try:
                self.ssh.run(inv["host"], inv["user"], ("" if inv["user"] == "root" else "sudo -n ") +
                             "bash -c 'systemctl disable --now meshagent >/dev/null 2>&1; rm -f /etc/systemd/system/meshagent.service; "
                             "for d in $(ip -o link show | grep -o \"wgm-[a-z0-9]*\" | sort -u); do ip link del $d 2>/dev/null; done; "
                             f"ip addr del {inv['overlay']}/32 dev lo 2>/dev/null; rm -rf {LIB} /etc/meshagent; true'", timeout=60)
                self.step(job, "agent removed from the server")
            except Exception as ex:  # noqa: BLE001
                self.step(job, f"server cleanup skipped ({ex})")
            self.inventory.pop(name, None)
            self.rebuild_cfg()
            self.event(f"node {name} removed from mesh", "node", name)
            job["status"] = "done"
        except Exception as ex:  # noqa: BLE001
            job["error"] = str(ex)[:400]
            job["status"] = "failed"
            self.step(job, f"FAILED: {job['error']}")

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
import re
import hmac
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional

import paramiko
import requests

from . import records
from .cleanup import cleanup_node
from .standalone_store import atomic_json
from .etcd_members import EtcdMembers
from .control_plane import ControlPlane
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


class Ops(ControlPlane, EtcdMembers):
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
        self.init_control_plane()
        self.ip_updates_path = self.plane_path.parent / "ip-updates.json" if self.plane_path else None
        self.ip_updates = json.loads(self.ip_updates_path.read_text()) if self.ip_updates_path and self.ip_updates_path.exists() else {}

    # ---- etcd through a member ----------------------------------------
    def members(self) -> List[dict]:
        if self.standalone():
            return [{**record, 'host': (self.ipmap.get(record['name']) or {}).get('ip', record.get('host'))} for record in self.plane_state.get('desired_members', [])]
        records = (self.control.get("etcd") or {}).get("members")
        return [{**m, "host": (self.ipmap.get(m["name"]) or {}).get("ip") or m["host"]} for m in records] if records else (self.cfg.get("mesh") or {}).get("read_via", [])

    def member_run(self, member, command, stdin=None, timeout=30):
        """Member certificates are root-only, including on sudo-based SSH accounts."""
        command = ('sudo -n ' if member.get('sudo') else '') + 'bash -c ' + shq(command)
        return self.ssh.run(member['host'], member.get('user', 'root'), command, stdin=stdin, timeout=timeout)

    def etcd_rpc(self, path: str, body: dict) -> dict:
        if self.standalone():
            return self.plane_store.rpc(path, body)
        return self.etcd_live_rpc(path, body)

    def etcd_live_rpc(self, path: str, body: dict) -> dict:
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
        self.inventory = records.inventory(self.inventory)
        self.ipmap = records.ipmap(self.ipmap)
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
        pending_cleanup = getattr(self, 'plane_state', {}).get('node_cleanup', {})
        for name, pending in pending_cleanup.items():
            self.inventory.setdefault(name, pending['inventory'])
            if pending.get('phase') == 'cleanup':
                cfg['entries'].pop(name, None); cfg['exits'].pop(name, None)
        for name, inv in self.inventory.items():
            if pending_cleanup.get(name, {}).get('phase') == 'cleanup': continue
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
        registered = {name: value.get('underlay') for name, value in self.mesh['nodes'].items() if value and value.get('underlay')}
        changes = {name: (record['old'], record['new']) for name, record in self.ip_updates.items()}
        for name, old, new in self.ipwatch.observe(registered, self.reported_ip):
            if self.flag('auto_ip_update'):
                changes.setdefault(name, (old, new))
            else:
                self.event(f'{name}: public IP changed (tracking disabled)', 'ip', name)
        for name, (old, new) in changes.items():
            if self.etcd_running or not self.node_operation_lock.acquire(blocking=False): return
            try:
                self.handle_ip_change(name, old, new)
            except Exception:
                self.event(f'{name}: IP update incomplete; durable operation will be retried', 'ip', name)
            finally:
                self.node_operation_lock.release()

    def save_ip_updates(self):
        if self.ip_updates_path is None: raise ValueError('IP updates require persistent controller state')
        atomic_json(self.ip_updates_path, self.ip_updates)

    def cloudflare_update(self, old: str, new: str) -> List[str]:
        token, zone = os.environ.get('CF_API_TOKEN'), self.cfg.get('cloudflare_zone')
        if not token or not zone: return []
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        base = 'https://api.cloudflare.com/client/v4'
        def request(method, path, **kwargs):
            response = requests.request(method, base+path, headers=headers, timeout=20, **kwargs)
            response.raise_for_status()
            data = response.json()
            if data.get('success') is not True: raise RuntimeError('DNS provider did not confirm the update')
            return data
        zones = request('GET', '/zones', params={'name': zone})['result']
        if len(zones) != 1: raise RuntimeError('DNS zone must resolve unambiguously')
        zone_id = zones[0]['id']; all_records = []; page = 1
        while True:
            data = request('GET', f'/zones/{zone_id}/dns_records', params={'per_page':200,'page':page,'content':old,'type':'A'})
            all_records.extend(data['result'])
            if page >= data.get('result_info', {}).get('total_pages', 1): break
            page += 1
        for record in all_records:
            request('PATCH', f"/zones/{zone_id}/dns_records/{record['id']}", json={'content': new})
        return [record['name'] for record in all_records]

    def handle_ip_change(self, name: str, old: str, new: str) -> None:
        records.name(name); records.ipv4(old); records.ipv4(new)
        if name not in self.ip_updates:
            spec = self._node_spec(name)
            rw_name = (self.inventory.get(name) or self.cfg['exits'].get(name) or self.cfg['entries'].get(name) or {}).get('rw_node')
            self.ip_updates[name] = {'old': old, 'new': new, 'user': spec.get('user', 'root'), 'rw_node': rw_name}
            self.save_ip_updates()  # before changing trust, DNS, panel addresses or mesh membership
        update = self.ip_updates[name]
        if (update['old'], update['new']) != (old, new): raise ValueError('complete the pending address update first')
        if not update.get('verified'):
            self.ssh.verify_host_move(old, new, update['user'])
            update['verified'] = True; self.save_ip_updates()
        if not update.get('panel_done'):
            if self.rw and update.get('rw_node'):
                match = next((node for node in self.rw.req('GET', '/api/nodes') if node['name'] == update['rw_node']), None)
                if not match or match.get('address') not in (old, new): raise RuntimeError('panel node address changed independently; reconciliation required')
                if match['address'] != new:
                    self.rw.req('PATCH', '/api/nodes', {'uuid': match['uuid'], 'address': new})
            update['panel_done'] = True; self.save_ip_updates()
        if not update.get('dns_done'):
            self.cloudflare_update(old, new)  # errors must keep the pending journal, never be swallowed
            update['dns_done'] = True; self.save_ip_updates()
        document = dict(self.mesh['nodes'][name], underlay=new)
        self.etcd_put(f'/mesh/nodes/{name}', document)
        mapping = {'ip': new, 'old': old, 'ts': int(time.time())}
        self.etcd_put(f'/mesh/ipmap/{name}', mapping)
        self.ipmap[name] = mapping; self.mesh['nodes'][name] = document
        self.rebuild_cfg()
        remaining = {key: value for key, value in self.ip_updates.items() if key != name}
        atomic_json(self.ip_updates_path, remaining)
        self.ip_updates = remaining
        self.event(f'{name}: verified public IP update completed', 'ip', name)

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
        fingerprint = req.get("host_key_fingerprint")
        if fingerprint is not None and (not isinstance(fingerprint, str) or not re.fullmatch(r"SHA256:[A-Za-z0-9+/]{43}", fingerprint)):
            raise ValueError("a valid SHA256 SSH host key fingerprint is required")
        if fingerprint and self.seed_path is None:
            raise ValueError("persistent controller state is required for SSH trust")
        err = validate_name(name, taken) or validate_host(host, allow_private=bool(self.cfg.get("allow_private_nodes")))
        if err:
            raise ValueError(err)
        if not (req.get("password") or req.get("private_key")):
            raise ValueError("password or private_key is required")
        if not self.mesh["etcd_up"] and not self.standalone():
            raise RuntimeError("etcd is not reachable, cannot register the node")
        if not self.node_operation_lock.acquire(blocking=False):
            raise ValueError("another mesh node operation is in progress")
        if self.plane_state.get('mode') == 'removed':
            self.save_plane(mode='standalone', cleanup_targets=None)
        if self.etcd_running or self.plane_state.get('mode') not in ('etcd', 'standalone', 'removed'):
            self.node_operation_lock.release()
            raise ValueError('complete the current control-plane operation first')
        job = self.new_job("add-node", f"add node {name} ({host})")
        secret = {"password": req.get("password"), "private_key": req.get("private_key")}
        threading.Thread(target=self._node_job, args=(self._onboard_run, job, name, host, str(req.get("user") or "root"), role, req.get("rw_node") or None, secret, bool(req.get("etcd")), fingerprint), daemon=True).start()
        return job

    def _node_job(self, operation, *args):
        try:
            operation(*args)
        finally:
            self.node_operation_lock.release()

    def _onboard_run(self, job: dict, name: str, host: str, user: str, role: str, rw_node: Optional[str], secret: dict, want_etcd: bool = False, fingerprint: Optional[str] = None) -> None:
        sensitive = [value for value in secret.values() if value]
        c = None
        try:
            # 1. first contact with the one-time credentials
            c = self.ssh.client(fingerprint)
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
            if fingerprint and not hmac.compare_digest(self.ssh.fingerprint(c.get_transport().get_remote_server_key()), fingerprint):
                raise ValueError("SSH host fingerprint does not match the independently verified value")
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
                f"printf '%s' {shq(chr(10) + pub + chr(10))} >> \"$LOGIN_HOME/.ssh/authorized_keys\") && "
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
            endpoints = [] if self.standalone() else ([m['client_url'] for m in self.members() if m.get('client_url')] or (self.cfg.get("mesh") or {}).get("etcd_endpoints") or [])
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
                self.read_mesh(force=True)
                links = self.mesh["obs"].get(name) or {}
                seen = sum(1 for v in links.values() if v.get("ok"))
                if seen >= (max(1, (len(seed) - 1) // 2) if len(seed) > 1 else 0):
                    break
                time.sleep(5)
            if seen == 0 and len(seed) > 1:
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

    def install_agent(self, node, name: str, overlay: str, seed: dict, endpoints: List[str], key_file: str = "/etc/wireguard/wgmesh.key") -> None:
        agent = (AGENT_DIR / "meshagent.py").read_text()
        routing = (Path(__file__).resolve().parent / "routing.py").read_text()
        node.put(f"{LIB}/meshagent.py", agent, "755")
        node.put(f"{LIB}/routing.py", routing)
        node.put(f"{LIB}/records.py", (Path(__file__).parent / "records.py").read_text())
        node.put("/etc/meshagent/nodes.json", json.dumps(seed, indent=1), "600")
        config = {"name": name, "overlay": overlay, "key_file": key_file,
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
        if self.standalone() and self.plane_state.get('mode') != 'resuming':
            config['etcd'] = []
            config['graph_file'] = '/etc/meshagent/graph.json'
            node.put('/etc/meshagent/graph.json', '{}', '600')
        node.put("/etc/meshagent/config.json", json.dumps(config, indent=1), "600")
        node.put("/etc/systemd/system/meshagent.service", AGENT_UNIT.format(lib=LIB))
        node.run("systemctl daemon-reload && systemctl enable meshagent >/dev/null 2>&1 && systemctl restart meshagent")

    def start_remove(self, name: str) -> dict:
        if name in self.ip_updates:
            raise ValueError('complete the pending IP update before removing the node')
        pending = self.plane_state.get('node_cleanup', {})
        if name not in self.inventory and name not in pending:
            raise ValueError('only managed nodes or pending cleanup targets can be removed here')
        if self.plane_path is None:
            raise ValueError('removal requires persistent controller state')
        if not self.node_operation_lock.acquire(blocking=False):
            raise ValueError('another mesh node operation is in progress')
        try:
            operation = self.control.get('operation') or {}
            if self.etcd_running or operation.get('stage') not in (None, 'done') or operation.get('cleanup_pending'):
                raise ValueError('complete the pending etcd membership operation first')
            if self.plane_state.get('mode') not in ('etcd', 'standalone'):
                raise ValueError('complete the current control-plane operation first')
            if name in {member['name'] for member in self.members()}:
                raise ValueError('remove the node from etcd membership first')
            if not self.standalone():
                overlay = self.mesh['nodes'].get(name, {}).get('overlay') or pending.get(name, {}).get('spec', {}).get('overlay')
                members = self.etcd_live_rpc('/cluster/member/list', {})['members']
                if any(member.get('name') == name or f'https://{overlay}:2381' in member.get('peerURLs', []) for member in members):
                    raise ValueError('remove the voting member or learner from etcd first')
            job = self.new_job('remove-node', f'remove node {name}')
            threading.Thread(target=self._node_job, args=(self._remove_run, job, name), daemon=True).start()
            return job
        except Exception:
            self.node_operation_lock.release()
            raise

    def _remove_run(self, job: dict, name: str) -> None:
        try:
            pending = dict(self.plane_state.get('node_cleanup', {}))
            if name not in pending:
                inv = dict(self.inventory[name])
                spec = {**self._node_spec(name), 'overlay': inv['overlay']}
                pending[name] = {'inventory': inv, 'spec': spec, 'phase': 'restore'}
                self.save_plane(node_cleanup=pending)
            target = pending[name]
            # Interrupted enables can have on=False while originals live in the pending operation.
            restore = [name]
            if target['inventory']['role'] == 'entry' and len(self.cfg['entries']) <= 1:
                restore = list(self.relay_state)
            for exit_name in restore:
                relay = self.relay_state.get(exit_name) or {}
                if relay.get('on') or relay.get('operation'):
                    self.set_relay(exit_name, False, reason='node removed')
            target['phase'] = 'cleanup'
            self.save_plane(node_cleanup=pending)
            self.etcd_del(f'/mesh/nodes/{name}')
            self.mesh['nodes'].pop(name, None)
            self.step(job, 'mesh membership removed; remote cleanup target is durable until completion')
            from .provision import Node
            cleanup_node(Node(name, target['spec'], self.ssh), target['spec'])
            for prefix in ('inventory', 'obs', 'route', 'relay', 'ipmap'):
                self.etcd_del(f'/mesh/{prefix}/{name}')
            self.inventory.pop(name, None)
            self.ipmap.pop(name, None)
            self.save_plane(node_cleanup={key: value for key, value in pending.items() if key != name})
            self.rebuild_cfg()
            self.event(f'node {name} removed from mesh', 'node', name)
            job['status'] = 'done'
        except Exception as error:
            job['error'] = str(error)[:400]
            job['status'] = 'failed'
            self.step(job, 'cleanup incomplete; retry removal to finish safely')

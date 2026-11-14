"""Pure logic of meshctl: probe-script generation, result parsing, decisions.

Kept free of I/O so it can be unit-tested without servers.
"""
from __future__ import annotations

import re
import shlex
import ipaddress
from dataclasses import dataclass, field
from typing import Dict, List, Optional

TRIES = 3
LINE_RE = re.compile(r"^P\|(?P<exit>[\w-]+)\|(?P<path>direct|wg)\|(?P<port>\d+)\|(?P<ok>\d+)\|(?P<ms>\d+)$")


def _script_args(name: str, ip: str, port: int, path: str) -> str:
    if not re.fullmatch(r'[a-zA-Z0-9_-]{1,128}', name): raise ValueError('invalid probe name')
    address = str(ipaddress.IPv4Address(ip))
    if type(port) is not int or not 1 <= port <= 65535: raise ValueError('invalid probe port')
    return 'probe %s %s %d %s &' % (shlex.quote(name), shlex.quote(address), port, shlex.quote(path))


def build_probe_script(exits: Dict[str, dict], ports: List[int], sni: str, tries: int = TRIES) -> str:
    """Shell script run on an *entry* host: TLS probes towards every exit.

    A probe succeeds when a TLS handshake completes and an HTTP answer comes
    back (http_code != 000). A plain TCP connect is NOT enough: the filter we
    fight lets SYN/SYN-ACK through and drops the payload.
    """
    if not re.fullmatch(r'[a-zA-Z0-9.-]{1,253}', sni): raise ValueError('invalid probe SNI')
    if type(tries) is not int or not 1 <= tries <= 10: raise ValueError('invalid probe attempts')
    lines = [
        "probe(){ ok=0; ms=0; for i in $(seq 1 %d); do" % tries,
        "  r=$(curl -sk -m 5 -o /dev/null -w '%%{http_code} %%{time_total}' --resolve %s:$3:$2 https://%s:$3/ 2>/dev/null)" % (sni, sni),
        "  c=${r%% *}; if [ -n \"$c\" ] && [ \"$c\" != 000 ]; then ok=$((ok+1)); ms=$(awk -v a=\"${r#* }\" 'BEGIN{printf \"%d\", a*1000}'); fi; done;",
        "  echo \"P|$1|$4|$3|$ok|$ms\"; }",
    ]
    for name, ex in exits.items():
        for port in ports:
            lines.append(_script_args(name, ex["public_ip"], port, "direct"))
            if ex.get("wg_ip"):
                lines.append(_script_args(name, ex["wg_ip"], port, "wg"))
    lines.append("wait")
    return "\n".join(lines)


@dataclass
class PathResult:
    ok: int = 0
    total: int = 0
    ms: int = 0

    @property
    def ratio(self) -> float:
        return self.ok / self.total if self.total else 0.0


def parse_probe_output(text: str, tries: int = TRIES) -> Dict[str, Dict[str, PathResult]]:
    """-> {exit: {path: PathResult}} aggregated over ports."""
    out: Dict[str, Dict[str, PathResult]] = {}
    for line in text.splitlines():
        m = LINE_RE.match(line.strip())
        if not m:
            continue
        r = out.setdefault(m["exit"], {}).setdefault(m["path"], PathResult())
        r.ok += int(m["ok"])
        r.total += tries
        r.ms = max(r.ms, int(m["ms"]))
    return out


@dataclass
class Hysteresis:
    """Flip state only after N consecutive opposite observations."""

    down_after: int = 3
    up_after: int = 5
    healthy: Optional[bool] = None
    _streak: int = 0
    _last: Optional[bool] = None

    def observe(self, ok: bool) -> bool:
        if self.healthy is None:
            self.healthy = ok
            self._streak = 0
            self._last = ok
            return self.healthy
        if ok == self.healthy:
            self._streak = 0
        else:
            self._streak = self._streak + 1 if ok == self._last else 1
            need = self.up_after if ok else self.down_after
            if self._streak >= need:
                self.healthy = ok
                self._streak = 0
        self._last = ok
        return self.healthy


def exit_ok_from_entries(per_entry: Dict[str, Dict[str, Dict[str, PathResult]]], exit_name: str, path: str, threshold: float) -> Optional[bool]:
    """True when every reachable entry sees the exit healthy on `path`.

    Entries that returned no data (ssh down) are ignored; None when no data.
    """
    vals = []
    for entry, data in per_entry.items():
        r = data.get(exit_name, {}).get(path)
        if r and r.total:
            vals.append(r.ratio >= threshold)
    if not vals:
        return None
    return all(vals)


def choose_path(direct_ok: Optional[bool], wg_ok: Optional[bool], current: str) -> str:
    """Prefer direct, fall back to wg, otherwise keep current."""
    if direct_ok:
        return "direct"
    if wg_ok:
        return "wg"
    return current


@dataclass
class ExitState:
    direct: Hysteresis = field(default_factory=lambda: Hysteresis(3, 5))
    wg: Hysteresis = field(default_factory=lambda: Hysteresis(3, 3))
    path: str = "direct"

"""Overlay routing for the WireGuard mesh: direct link, else one transit hop.

Pure functions, no I/O. Every node runs the same computation over the same
published health graph (etcd), so both ends of a pair pick the same transit.
That symmetry is required by WireGuard: the receiver checks that the packet's
source address is in AllowedIPs of the peer it came from, so if A reaches D
via T, D must also accept A's addresses from T.
"""
from __future__ import annotations

import math
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Tuple

# link observation published by a node about one of its peers
#   {"ok": bool, "rtt": float|None}
Obs = Dict[str, Dict[str, dict]]  # reporter -> peer -> observation


def edge_ok(obs: Obs, a: str, b: str) -> bool:
    """A link is usable only if both ends see traffic from each other.

    A reporter that published nothing (dead agent, expired lease) counts as
    'does not see the peer'. WireGuard needs both directions to work.
    """
    ab = obs.get(a, {}).get(b)
    ba = obs.get(b, {}).get(a)
    return bool(ab and ba and ab.get("ok") and ba.get("ok"))


def next_hops(nodes: Iterable[str], obs: Obs, me: str, prio: Optional[Dict[str, int]] = None, *, quality: bool = False, current=None, loads=None) -> Dict[str, Optional[str]]:
    """For every other node: None = go direct, or the name of the transit node.

    By default transit is picked by (priority, name) among nodes that both ends see as
    healthy. Quality policy uses coarse RTT/loss/load scores, retaining a usable current
    transit until another improves by 25% and at least 25ms. Legacy policy ignores
    latency: noisy inputs previously made
    the two ends disagree for a moment, and WireGuard drops packets whose source
    is not in the peer's AllowedIPs. Booleans + a fixed order are stable.

    If a destination is unreachable even through a transit, the answer stays
    None (keep trying the direct path; nothing better exists).
    """
    names = sorted(set(nodes))
    out: Dict[str, Optional[str]] = {}
    for d in names:
        if d == me:
            continue
        if edge_ok(obs, me, d):
            out[d] = None
            continue
        candidates, costs = [], {}
        for t in names:
            if t in (me, d): continue
            if edge_ok(obs, me, t) and edge_ok(obs, t, d):
                cost = link_cost(obs, me, t) + link_cost(obs, t, d) + 100 * finite((loads or {}).get(t), 0, 4)
                costs[t] = cost
                candidates.append((((prio or {}).get(t, 0), int(cost // 25) if quality else 0, t), t))
        if not candidates:
            out[d] = None
            continue
        best = min(candidates)[1]
        previous = (current or {}).get(d)
        if quality and previous in costs and (prio or {}).get(previous, 0) == (prio or {}).get(best, 0):
            if costs[previous] - costs[best] < max(25, costs[previous] * 0.25): best = previous
        out[d] = best
    return out


def finite(value, default=100.0, maximum=60000.0):
    try:
        value = float(value)
        return min(max(0.0, value), maximum) if math.isfinite(value) else default
    except (ValueError, TypeError):
        return default


def link_cost(obs, a, b):
    reports = [obs.get(a, {}).get(b, {}), obs.get(b, {}).get(a, {})]
    return max(finite(v.get("rtt")) for v in reports) + 1000 * max(finite(v.get("loss"), 0, 1) for v in reports)


class LinkQuality:
    """Smooth RTT and report loss over the last minute of five-second probes."""
    def __init__(self):
        self.samples = deque(maxlen=12)
        self.rtt = None

    def update(self, rtt):
        self.samples.append(rtt is not None)
        if rtt is not None:
            value = finite(rtt)
            self.rtt = value if self.rtt is None else self.rtt * 0.7 + value * 0.3
        return {"rtt": round(self.rtt, 1) if self.rtt is not None else None,
                "loss": round(1 - sum(self.samples) / len(self.samples), 3)}


def canonical_pair_hop(nodes: Iterable[str], obs: Obs, a: str, b: str) -> Optional[str]:
    """Transit for the unordered pair (a, b); identical from both ends."""
    x, y = sorted((a, b))
    return next_hops(nodes, obs, x).get(y)


def allowed_ips(me: str, overlay: Dict[str, str], hops: Dict[str, Optional[str]]) -> Dict[str, List[str]]:
    """AllowedIPs per peer: its own /32 plus every destination routed through it.

    `next_hops` is symmetric (same inputs and same order from both ends), so
    'A via T to D' implies 'D via T to A' on the other side.
    """
    res: Dict[str, List[str]] = {p: [overlay[p] + "/32"] for p in overlay if p != me}
    for dest, via in hops.items():
        if via is not None and dest in overlay and via in res and dest in res:
            # an address belongs to exactly one peer in WireGuard: move it to the
            # transit and take it away from the (dead) direct peer, otherwise the
            # two entries steal it from each other depending on the order of `wg set`
            res[dest] = [ip for ip in res[dest] if ip != overlay[dest] + "/32"]
            res[via].append(overlay[dest] + "/32")
    return res


@dataclass
class LinkTracker:
    """Debounce for a single local link: down after N bad rounds, up after M good."""

    down_after: int = 3
    up_after: int = 6
    ok: bool = True
    _bad: int = 0
    _good: int = 0

    def update(self, seen: bool) -> bool:
        if seen:
            self._good += 1
            self._bad = 0
            if not self.ok and self._good >= self.up_after:
                self.ok = True
        else:
            self._bad += 1
            self._good = 0
            if self.ok and self._bad >= self.down_after:
                self.ok = False
        return self.ok

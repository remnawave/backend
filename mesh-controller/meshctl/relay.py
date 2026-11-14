"""Relay planning: which exits get a forward through the entries, and which hosts to rewrite.

Pure functions. The effects (iptables on the entries, Remnawave host updates) live in app.py.

A relay is a DNAT on every entry: <entry>:<relay port> -> <exit overlay IP>:<real port>.
Clients are pointed to it by rewriting the exit's hosts in Remnawave to <relay address>:<relay port>.
The overlay finds its own path to the exit, so the relay keeps working when the direct link is dead.
"""
from __future__ import annotations

from typing import Dict, List, Optional

# real exit port -> index inside a slot; 5443 is Hysteria2 (UDP), the rest is TCP
PORT_IDX: Dict[int, int] = {4433: 0, 4434: 1, 4435: 2, 4436: 3, 8443: 4, 13446: 5, 5443: 6}
UDP_PORTS = {5443}
SLOT_BASE = 45000
SLOT_SIZE = 100


def relay_port(slot: int, port: int) -> Optional[int]:
    idx = PORT_IDX.get(port)
    return None if idx is None else SLOT_BASE + SLOT_SIZE * slot + idx


def forward_rules(slot: int, ports=PORT_IDX) -> List[list]:
    """[[proto, relay_port, real_port], ...] for one exit."""
    return [["udp" if p in UDP_PORTS else "tcp", relay_port(slot, p), p] for p in ports]


def next_slot(used: set) -> int:
    s = 0
    while s in used:
        s += 1
    return s


def wants_relay(exit_cfg: dict, direct_healthy: Optional[bool], overlay_healthy: Optional[bool]) -> Optional[bool]:
    """True/False = relay should be on/off, None = no opinion (keep what we have).

    ON  when the direct path is (debounced) dead but the overlay path works.
    OFF when the direct path works again.
    Exits without a slot / overlay address / Remnawave node, or marked legacy (hand-made relay), are skipped.
    """
    if exit_cfg.get("relay") == "legacy" or exit_cfg.get("relay_slot") is None:
        return None
    if not exit_cfg.get("wg_ip") or not exit_cfg.get("rw_node"):
        return None
    if direct_healthy is None:
        return None
    if direct_healthy:
        return False
    return True if overlay_healthy else None


def host_rewrites(hosts: List[dict], node_uuid: str, relay_address: str, slot: int) -> List[dict]:
    """Hosts pinned to the exit's node that can be moved to the relay.

    Hosts with ports outside PORT_IDX are left alone. Already rewritten hosts are skipped.
    """
    out = []
    for h in hosts:
        if set(h.get("nodes") or []) != {node_uuid}:
            continue
        rp = relay_port(slot, h.get("port"))
        if rp is None or h.get("address") == relay_address:
            continue
        out.append({"uuid": h["uuid"], "address": h["address"], "port": h["port"],
                    "new_address": relay_address, "new_port": rp})
    return out


def host_restores(saved: List[dict]) -> List[dict]:
    """Patches that put the saved hosts back."""
    return [{"uuid": s["uuid"], "address": s["address"], "port": s["port"]} for s in saved]

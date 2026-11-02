"""Pure helpers for adding a node to the mesh (validation, overlay address allocation)."""
from __future__ import annotations

import ipaddress
import re
from typing import Iterable, Optional

NAME_RE = re.compile(r"^[a-z][a-z0-9]{1,7}$")        # "wgm-<name>" must fit into 15 chars of an interface name
ENTRY_RANGE = range(3, 11)                            # 10.88.0.3 .. .10 (ru1=.1, ru2=.2)
EXIT_RANGE = range(16, 200)                           # existing exits use .11 .. .15
OVERLAY_PREFIX = "10.88.0."


def validate_name(name: str, taken: Iterable[str]) -> Optional[str]:
    if not isinstance(name, str) or not NAME_RE.match(name):
        return "name: 2-8 chars, lowercase letters and digits, starting with a letter"
    if name in set(taken):
        return f"name {name!r} is already in the mesh"
    return None


def validate_host(host: str) -> Optional[str]:
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return "host must be an IP address"
    if not ip.is_global:
        return "host must be a public IP address"
    return None


def allocate_overlay(used: Iterable[str], role: str) -> Optional[str]:
    taken = {int(u.rsplit(".", 1)[1]) for u in used if u.startswith(OVERLAY_PREFIX)}
    for n in (ENTRY_RANGE if role == "entry" else EXIT_RANGE):
        if n not in taken:
            return f"{OVERLAY_PREFIX}{n}"
    return None

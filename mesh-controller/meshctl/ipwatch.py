"""Detect that a node's public IP changed (hoster re-addressed the server).

Each agent publishes the source address it uses to reach the internet, but only a public one
(behind NAT it is private and nothing is reported). The controller compares it with the registered
address and acts after a few consecutive identical reports, so a glitch does not rewrite DNS.
"""
from __future__ import annotations

import ipaddress
from typing import Dict, List, Tuple


def is_public(ip) -> bool:
    try:
        return ipaddress.ip_address(ip).is_global
    except (ValueError, TypeError):
        return False


class IpWatch:
    def __init__(self, need: int = 3):
        self.need = need
        self._seen: Dict[str, Tuple[str, int]] = {}   # node -> (candidate ip, consecutive reports)

    def observe(self, registered: Dict[str, str], reported: Dict[str, str]) -> List[Tuple[str, str, str]]:
        """-> [(node, old_ip, new_ip)] for nodes whose new address was reported `need` times in a row."""
        changed = []
        for name, old in registered.items():
            new = reported.get(name)
            if not new or not is_public(new) or new == old:
                self._seen.pop(name, None)
                continue
            cand, n = self._seen.get(name, (new, 0))
            n = n + 1 if cand == new else 1
            self._seen[name] = (new, n)
            if n >= self.need:
                changed.append((name, old, new))
                self._seen.pop(name, None)
        return changed

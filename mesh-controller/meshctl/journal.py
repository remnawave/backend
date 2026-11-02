"""Durable relay plans: originals must be recorded before any external change."""
from .relay import host_rewrites, relay_port


def prepare_enable(hosts, node_uuid, address, slot, saved):
    plans = host_rewrites(hosts, node_uuid, address, slot)
    originals = {h['uuid']: dict(h) for h in saved}
    for p in plans:
        originals.setdefault(p['uuid'], dict(p))
    return plans, list(originals.values())


def prepare_restore(saved, address, slot):
    return [dict(h, new_address=h.get('new_address', address),
                 new_port=h.get('new_port', relay_port(slot, h['port']))) for h in saved]


def host_patches(plans, hosts, on):
    """Retry already-applied patches, skip deleted hosts, reject unrelated edits."""
    live = {h['uuid']: h for h in hosts}
    out = []
    for p in plans:
        h = live.get(p['uuid'])
        if h is None:
            continue
        original = (p['address'], p['port'])
        relayed = (p['new_address'], p['new_port'])
        actual = (h['address'], h['port'])
        desired = relayed if on else original
        if actual == desired:
            continue
        if actual not in (original, relayed):
            raise RuntimeError(f"host {p['uuid']} changed outside the relay operation; reconcile it before retrying")
        out.append({'uuid': p['uuid'], 'address': desired[0], 'port': desired[1]})
    return out

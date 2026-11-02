"""Validate shared mesh records before using them for privileged network operations.

This module is stdlib-only and is installed beside the node agent.
"""
import base64
import ipaddress
import re
from urllib.parse import urlsplit

NAME = re.compile(r'^[a-z][a-z0-9]{0,7}$')
USER = re.compile(r'^[a-z_][a-z0-9_-]{0,31}$')
OVERLAY = ipaddress.IPv4Network('10.88.0.0/24')


def name(value):
    if not isinstance(value, str) or not NAME.fullmatch(value):
        raise ValueError('invalid mesh node name')
    return value


def ipv4(value, overlay=False):
    if not isinstance(value, str): raise ValueError('mesh addresses must be IPv4 strings')
    address = ipaddress.IPv4Address(value)
    if address.is_unspecified or address.is_multicast or address.is_loopback or address.is_link_local:
        raise ValueError('invalid mesh address')
    if overlay and (address not in OVERLAY or address in (OVERLAY.network_address, OVERLAY.broadcast_address)):
        raise ValueError('invalid overlay address')
    return str(address)


def nodes(records):
    if not isinstance(records, dict) or len(records) > 254:
        raise ValueError('invalid mesh registry')
    clean = {}; addresses = set()
    for key, value in records.items():
        name(key)
        if not isinstance(value, dict): raise ValueError('invalid mesh node')
        overlay = ipv4(value['overlay'], overlay=True)
        if overlay in addresses: raise ValueError('duplicate overlay address')
        addresses.add(overlay)
        public = value['pubkey']
        if not isinstance(public, str) or len(public) != 44 or len(base64.b64decode(public, validate=True)) != 32:
            raise ValueError('invalid WireGuard public key')
        priority = value.get('prio', 0)
        if type(priority) is not int or not -100000 <= priority <= 100000: raise ValueError('invalid node priority')
        clean[key] = {**value, 'overlay': overlay, 'underlay': ipv4(value['underlay']), 'pubkey': public, 'prio': priority}
    return clean


def inventory(records):
    clean = {}
    for key, value in records.items():
        name(key)
        if not isinstance(value, dict) or value.get('role') not in ('entry', 'exit'): raise ValueError('invalid node inventory')
        user = value.get('user', 'root')
        if not isinstance(user, str) or not USER.fullmatch(user): raise ValueError('invalid SSH user')
        rw_node = value.get('rw_node')
        if rw_node is not None and (not isinstance(rw_node, str) or not 1 <= len(rw_node) <= 128): raise ValueError('invalid panel node reference')
        slot = value.get('slot')
        if slot is not None and (type(slot) is not int or not 0 <= slot < 200): raise ValueError('invalid relay slot')
        clean[key] = {**value, 'host': ipv4(value['host']), 'overlay': ipv4(value['overlay'], overlay=True), 'user': user}
    return clean


def ipmap(records):
    return {name(key): {**value, 'ip': ipv4(value['ip'])} for key, value in records.items()}


def endpoint(value, registry, port=2389, secure=True):
    parsed = urlsplit(value)
    if parsed.scheme != ('https' if secure else 'http') or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment or parsed.port != port:
        raise ValueError('invalid discovered etcd endpoint')
    if parsed.hostname not in {node['overlay'] for node in registry.values()}:
        raise ValueError('etcd endpoint is outside the mesh registry')
    return value


def control(records, registry):
    result = dict(records)
    if records.get('etcd'):
        members = []
        for record in records['etcd'].get('members', []):
            key = name(record['name'])
            if key not in registry: raise ValueError('unknown etcd member')
            user = record.get('user', 'root')
            if not USER.fullmatch(user): raise ValueError('invalid SSH user')
            members.append({**record, 'host': ipv4(record['host']), 'user': user,
                'client_url': endpoint(record['client_url'], registry), 'peer_url': endpoint(record['peer_url'], registry, 2381)})
        result['etcd'] = {**records['etcd'], 'members': members}
    return result

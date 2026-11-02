"""Durable local control-plane journal used while etcd is deliberately stopped."""
import base64
import json
import os
from pathlib import Path
import threading
import time


def encoded(value):
    return base64.b64encode(value.encode()).decode()


def decoded(value):
    return base64.b64decode(value).decode()


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temporary = path.with_suffix('.tmp')
    with open(temporary, 'w', opener=lambda name, flags: os.open(name, flags, 0o600)) as output:
        json.dump(value, output); output.flush(); os.fsync(output.fileno())
    os.replace(temporary, path)
    descriptor = os.open(str(path.parent), os.O_RDONLY)
    try: os.fsync(descriptor)
    finally: os.close(descriptor)


class StandaloneStore:
    def __init__(self, path):
        self.path = Path(path)
        self.lock = threading.RLock()
        self.entries = json.loads(self.path.read_text()) if self.path.exists() else {}
        self.leases = {}
        self.sequence = int(time.time() * 1000)

    def seed(self, values):
        with self.lock:
            self.entries = {key: {'value': value, 'expires': value.get('ts', time.time()) + 604800 if key.startswith('/mesh/log/') and isinstance(value, dict) else None} for key, value in values.items()}
            atomic_json(self.path, self.entries)

    def snapshot(self):
        with self.lock:
            now = time.time()
            return {key: row['value'] for key, row in self.entries.items()
                    if row.get('expires') is None or row['expires'] > now}

    def rpc(self, path, body):
        with self.lock:
            if path == '/lease/grant':
                self.sequence += 1
                self.leases[str(self.sequence)] = time.time() + min(max(int(body['TTL']), 1), 604800)
                return {'ID': str(self.sequence)}
            key = decoded(body.get('key', ''))
            end = decoded(body['range_end']) if body.get('range_end') else None
            if path == '/kv/range':
                return {'kvs': [{'key': encoded(name), 'value': encoded(json.dumps(value))}
                    for name, value in sorted(self.snapshot().items())
                    if name == key or end is not None and key <= name < end]}
            if path == '/kv/put':
                if not key.startswith('/mesh/'):
                    raise ValueError('local journal is restricted to the mesh namespace')
                self.entries[key] = {'value': json.loads(decoded(body['value'])),
                    'expires': self.leases.get(str(body.get('lease')))}
            elif path == '/kv/deleterange':
                for name in list(self.entries):
                    if name == key or end is not None and key <= name < end:
                        del self.entries[name]
            else:
                raise ValueError('operation requires a running etcd cluster')
            atomic_json(self.path, self.entries)
            return {}

"""Verified mTLS for the controller's remote etcd JSON-gateway requests."""
import shlex
from urllib.parse import urlparse


def curl_etcd(config, endpoint=None, timeout=8):
    mesh = config.get('mesh', config)
    endpoint = endpoint or mesh.get('etcd_local_url', 'http://127.0.0.1:2379')
    tls = mesh.get('etcd_tls') or {}
    args = ['curl', '-sf', '-m', str(timeout)]
    if tls:
        if urlparse(endpoint).scheme != 'https':
            raise ValueError('mTLS etcd endpoints must use https; HTTP fallback is forbidden')
        for flag, key in [('--cacert', 'ca_file'), ('--cert', 'cert_file'), ('--key', 'key_file')]:
            value = tls.get(key)
            if not isinstance(value, str) or not value.startswith('/'):
                raise ValueError('all etcd TLS certificate paths must be absolute')
            args.extend([flag, value])
    elif urlparse(endpoint).scheme == 'https':
        raise ValueError('HTTPS etcd requires explicit CA and client certificate configuration')
    return ' '.join(shlex.quote(v) for v in args), endpoint.rstrip('/')

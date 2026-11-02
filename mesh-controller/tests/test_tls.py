import importlib.util
from pathlib import Path
import ssl
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request
import pytest
from meshctl.pki import create_ca, issue
from meshctl.transport import curl_etcd
from meshctl.mtls import rewrite_flags


def test_real_agent_tls_requires_trusted_server_and_client_certificate(tmp_path):
    ca, ca_key = create_ca()
    sc, sk = issue(ca, ca_key, 'server', ['127.0.0.1'], server=True)
    cc, ck = issue(ca, ca_key, 'client')
    wrong, _ = create_ca()
    paths = {}
    for name,value in [('ca',ca),('wrong',wrong),('sc',sc),('sk',sk),('cc',cc),('ck',ck)]:
        f=tmp_path/name;f.write_text(value);f.chmod(0o600);paths[name]=str(f)
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            self.rfile.read(int(self.headers.get('Content-Length','0')))
            self.send_response(200);self.end_headers();self.wfile.write(b'{"ok":true}')
        def log_message(self,*args): pass
    server=HTTPServer(('127.0.0.1',0),Handler)
    ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(paths['sc'],paths['sk']);ctx.load_verify_locations(paths['ca']);ctx.verify_mode=ssl.CERT_REQUIRED
    server.socket=ctx.wrap_socket(server.socket,server_side=True)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    spec=importlib.util.spec_from_file_location('agent_tls_test',Path(__file__).parents[1]/'agent/meshagent.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    tls={'ca_file':paths['ca'],'cert_file':paths['cc'],'key_file':paths['ck']}
    ep=f'https://127.0.0.1:{server.server_port}'
    try:
        assert module.Etcd([ep],tls).call('/kv/range',{})=={'ok':True}
        with pytest.raises(RuntimeError): module.Etcd([ep],{**tls,'ca_file':paths['wrong']}).call('/kv/range',{})
        with pytest.raises(Exception): urllib.request.urlopen(urllib.request.Request(ep+'/v3/kv/range',data=b'{}'),context=ssl.create_default_context(cafile=paths['ca']),timeout=2)
        with pytest.raises(ValueError): module.Etcd(['http://127.0.0.1:2379'],tls)
        with pytest.raises(ValueError): module.Etcd([ep])
    finally: server.shutdown();server.server_close()


def test_controller_transport_fails_closed():
    c={'mesh':{'etcd_local_url':'https://127.0.0.1:2389','etcd_tls':{'ca_file':'/tls/ca','cert_file':'/tls/client','key_file':'/tls/key'}}}
    cmd,url=curl_etcd(c)
    assert '--cacert' in cmd and '--cert' in cmd and '--key' in cmd and 'insecure' not in cmd
    with pytest.raises(ValueError): curl_etcd(c,'http://127.0.0.1:2379')
    assert url.startswith('https://')


def test_rewrite_preserves_data_and_tuning():
    args=['etcd','--data-dir','/etcd-data','--listen-peer-urls=http://10.0.0.1:2380','--initial-cluster-state','new','--quota-backend-bytes','268435456']
    result=rewrite_flags(args,{'--listen-peer-urls':'https://10.0.0.1:2381','--initial-cluster-state':'existing'})
    assert '/etcd-data' in result and '268435456' in result and 'new' not in result
    assert not any('http://' in a for a in result)

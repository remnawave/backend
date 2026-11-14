import http.client as http_client
import threading
from unittest.mock import Mock

import pytest
import meshctl.app as app


@pytest.fixture
def http(monkeypatch):
    monkeypatch.setenv('MESH_API_TOKEN', 'test-only-controller-authentication-token')
    real = app.ThreadingHTTPServer
    servers=[]
    # The production server is captured so its lifetime is bounded by the fixture.
    class Captured(real):
        def __init__(self, address, handler):
            super().__init__(('127.0.0.1', 0),handler)
            servers.append(self)
    monkeypatch.setattr(app,'ThreadingHTTPServer',Captured)
    mesh=Mock();mesh.status.return_value={'cycles':1}
    def start():
        app.serve(mesh, 0)
    thread=threading.Thread(target=start,daemon=True);thread.start()
    import time
    for _ in range(100):
        if servers: break
        time.sleep(.01)
    assert servers
    def request(method,path,body=None,authenticated=False):
        client=http_client.HTTPConnection('127.0.0.1',servers[0].server_port,timeout=2)
        headers={'X-Mesh-Token':'test-only-controller-authentication-token'} if authenticated else {}
        client.request(method,path,body,headers)
        response=client.getresponse();data=response.read();client.close()
        return response.status,data
    yield request,mesh
    servers[0].shutdown();servers[0].server_close();thread.join(2)


def test_status_and_actions_require_authentication(http):
    req,mesh=http
    assert req('GET','/status')[0]==403
    assert req('POST','/api/probe','{}')[0]==403
    assert req('GET','/status',authenticated=True)==(200,b'{"cycles": 1}')
    mesh.wake.set.assert_not_called()


def test_malformed_or_large_bodies_cannot_invoke_actions(http):
    req,mesh=http
    assert req('POST','/api/probe','[]',True)[0]==400
    assert req('POST','/api/probe','{',True)[0]==400
    assert req('POST','/api/probe','x'*65537,True)[0]==413
    mesh.wake.set.assert_not_called()


def test_health_and_unknown_paths(http):
    req,mesh=http
    assert req('GET','/healthz')==(200,b'ok')
    assert req('GET','/unknown')[0]==404
    assert req('POST','/api/probe','{}',True)[0]==200
    mesh.wake.set.assert_called_once()

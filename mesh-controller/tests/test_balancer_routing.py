import copy

import pytest

from meshctl.balancer import backend_route
from meshctl.app import Mesh


@pytest.mark.parametrize('direct,overlay,path,healthy', [
    (True, True, 'direct', True),
    (True, False, 'direct', True),
    (False, True, 'mesh', True),
    (None, True, 'mesh', True),
    (False, False, 'unavailable', False),
    (False, None, 'unavailable', False),
    (None, None, 'unavailable', None),
])
def test_effective_backend_route(direct, overlay, path, healthy):
    cfg = {'public_ip': '192.0.2.1', 'wg_ip': '10.88.0.11'}
    r = backend_route(cfg, direct, overlay, {'overlay': '10.88.0.11'})
    assert r['path'] == path and r['healthy'] is healthy
    assert r['address'] == ('10.88.0.11' if path == 'mesh' else '192.0.2.1')
    assert cfg == {'public_ip': '192.0.2.1', 'wg_ip': '10.88.0.11'}


def test_overlay_is_never_invented_for_unenrolled_or_mismatched_nodes():
    for cfg, registry in [
        ({'public_ip': '192.0.2.1'}, {}),
        ({'public_ip': '192.0.2.1', 'wg_ip': '10.88.0.11'}, {}),
        ({'public_ip': '192.0.2.1', 'wg_ip': '10.88.0.11'}, {'overlay': '10.88.0.12'}),
        ({'public_ip': '192.0.2.1', 'wg_ip': '8.8.8.8'}, {'overlay': '8.8.8.8'}),
    ]:
        assert backend_route(cfg, False, True, registry)['healthy'] is False


def test_membership_uses_mesh_only_after_explicit_ordered_activation(monkeypatch):
    monkeypatch.delenv('MESHCTL_STATE_DIR', raising=False)
    class RW:
        changes = None
        def balancer(self, **kwargs):
            assert kwargs['uuid'] == 'selected'
            return {'uuid': 'selected', 'nodes': [{'nodeName': 'EXIT', 'isDisabled': True}]}
        def set_disabled(self, balancer, changes):
            self.changes = copy.deepcopy(changes)

    m = Mesh({'exits': {'es': {'rw_node': 'EXIT', 'public_ip': '192.0.2.1', 'wg_ip': '10.88.0.11'}},
              'entries': {}, 'balancer_uuid': 'selected', 'auto_balancer': True}, None, RW())
    m.event = lambda *args: None
    m.state['es'].direct.healthy = False
    m.state['es'].wg.healthy = True
    m.mesh['nodes']['es'] = {'overlay': '10.88.0.11'}
    m.manage_balancer()
    assert m.rw.changes is None  # Old backend must not be enabled before the panel update.
    m.cfg['balancer_routing_mode'] = 'mesh-fallback'
    m.manage_balancer()
    assert m.rw.changes == {'EXIT': False}
    m.cfg['balancer_pin_disabled'] = ['EXIT']
    m.rw.changes = None
    m.manage_balancer()
    assert m.rw.changes is None  # A pin wins even when the mesh path works.


def test_pause_and_restart_keep_the_last_backend_plan(tmp_path, monkeypatch):
    monkeypatch.setenv('MESHCTL_STATE_DIR', str(tmp_path))
    cfg = {'exits': {'es': {'rw_node': 'EXIT', 'public_ip': '192.0.2.1', 'wg_ip': '10.88.0.11'}},
           'entries': {}, 'balancer_routing_mode': 'mesh-fallback', 'auto_balancer': True}
    m = Mesh(cfg, None, None)
    m.event = lambda *args: None
    m.selected_balancer_uuid = 'selected'
    m.state['es'].direct.healthy = False
    m.state['es'].wg.healthy = True
    m.mesh['nodes']['es'] = {'overlay': '10.88.0.11'}
    m.refresh_backend_routes()
    assert m.backend_routes['EXIT']['path'] == 'mesh'
    m.cfg['auto_balancer'] = False
    m.state['es'].direct.healthy = True
    m.refresh_backend_routes()
    assert m.backend_routes['EXIT']['path'] == 'mesh'
    restored = Mesh({**cfg, 'auto_balancer': False}, None, None)
    assert restored.selected_balancer_uuid == 'selected'
    assert restored.backend_routes['EXIT']['path'] == 'mesh'

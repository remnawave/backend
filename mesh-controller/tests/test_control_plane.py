import json
import threading
from types import SimpleNamespace
import pytest
from meshctl.control_plane import ControlPlane
from meshctl.standalone_store import StandaloneStore, encoded


def test_journal_survives_restart_and_preserves_latest_settings(tmp_path):
    path = tmp_path / 'journal.json'
    store = StandaloneStore(path)
    store.seed({'/mesh/flags/main': {'auto_switch': False}})
    store.rpc('/kv/put', {'key': encoded('/mesh/flags/main'), 'value': encoded(json.dumps({'auto_switch': True}))})
    assert StandaloneStore(path).snapshot() == {'/mesh/flags/main': {'auto_switch': True}}
    assert path.stat().st_mode & 0o777 == 0o600
    with pytest.raises(ValueError):
        store.rpc('/kv/put', {'key': encoded('/unrelated/key'), 'value': encoded('{}')})


class Plane(ControlPlane):
    def __init__(self, tmp_path):
        self.plane_path = tmp_path / 'plane.json'
        self.plane_store = StandaloneStore(tmp_path / 'journal.json')
        self.plane_state = {'mode': 'etcd'}
        self.cfg = {}; self.control = {}; self.calls = []
    def _member_records(self, members): return members
    def snapshot_live_store(self):
        self.calls.append('snapshot')
        self.plane_store.seed({'/mesh/nodes/n1': {'overlay': '10.88.0.1'}})
    def all_node_specs(self): return {}
    def step(self, *args): pass
    def event(self, *args): pass
    def load_standalone(self, **kwargs): self.calls.append('load')
    def sync_standalone(self, **kwargs): self.calls.append('sync')
    def _node_spec(self, name): return {'name': name}


def test_pause_snapshots_and_reconfigures_before_stopping_every_voter(tmp_path, monkeypatch):
    plane = Plane(tmp_path)
    class Node:
        def __init__(self, name, *args): self.name = name
        def run(self, command, **kwargs):
            assert plane.plane_path.exists()
            assert plane.calls == ['snapshot', 'load', 'sync']
            assert 'docker stop etcd' in command and 'rm ' not in command
            stopped.append(self.name)
    stopped = []
    plane.ssh = None
    monkeypatch.setattr('meshctl.provision.Node', Node)
    plane.pause_etcd('n3', [{'name': f'n{i}'} for i in range(1, 4)], {})
    assert stopped == ['n1', 'n2', 'n3']
    assert plane.plane_state['mode'] == 'standalone'
    assert [row['name'] for row in plane.plane_state['desired_members']] == ['n1', 'n2']
    assert plane.plane_store.snapshot()['/mesh/nodes/n1']


def test_pause_failure_retains_retry_targets_and_does_not_report_success(tmp_path, monkeypatch):
    plane = Plane(tmp_path); plane.ssh = None
    plane.save_plane(mode='pausing', paused_members=[{'name':'n1'}, {'name':'n2'}], stop_pending=['n1','n2'])
    class Node:
        def __init__(self, name, *args): self.name = name
        def run(self, *args, **kwargs):
            if self.name == 'n2': raise OSError('offline')
    monkeypatch.setattr('meshctl.provision.Node', Node)
    with pytest.raises(RuntimeError, match='n2'): plane.finish_pause({})
    assert plane.plane_state['mode'] == 'pausing'
    assert plane.plane_state['stop_pending'] == ['n2']


def test_two_selected_voters_never_start_etcd(tmp_path):
    plane = Plane(tmp_path)
    plane.mesh = {'nodes': {'n2': {'overlay': '10.88.0.2'}}}
    plane.save_plane(mode='standalone', desired_members=[{'name':'n1'}])
    plane.resume_etcd = lambda *args: pytest.fail('etcd must remain stopped below three')
    plane.change_standalone_member('n2', True, {})
    assert len(plane.plane_state['desired_members']) == 2
    assert plane.plane_state['mode'] == 'standalone'


def test_existing_tls_is_never_silently_replaced(tmp_path):
    plane = Plane(tmp_path)
    plane.cfg = {'mesh': {'etcd_tls': {'ca_file':'existing-ca'}}}
    with pytest.raises(ValueError, match='automatic replacement is disabled'):
        plane.ensure_plane_pki()
    assert not (tmp_path / 'pki').exists()


def test_full_removal_keeps_offline_cleanup_durable_and_retryable(tmp_path, monkeypatch):
    plane = Plane(tmp_path)
    plane.save_plane(mode='standalone', desired_members=[])
    plane.plane_store.seed({'/mesh/nodes/n1': {'overlay':'10.88.0.1'}})
    plane.relay_state = {}; plane.ssh = None; plane.base_cfg = {}; plane.state = {}
    plane.wake = threading.Event(); plane.node_operation_lock = threading.Lock()
    plane.all_node_specs = lambda: {'n1': {'overlay':'10.88.0.1'}, 'n2': {'overlay':'10.88.0.2'}}
    calls = []; offline = {'n2'}
    class Node:
        def __init__(self, name, *args): self.name = name
        def run(self, command, **kwargs):
            calls.append(self.name)
            if self.name in offline: raise OSError('offline')
            assert 'MESHFWD' in command and 'systemctl disable --now meshagent' in command
            assert 'rm -rf /var/lib/etcd' not in command
    monkeypatch.setattr('meshctl.provision.Node', Node)
    plane.node_operation_lock.acquire()
    job = {}
    plane._teardown_worker(job)
    assert job['status'] == 'failed'
    assert json.loads(plane.plane_path.read_text())['cleanup_targets'] == {'n2': {'overlay':'10.88.0.2'}}
    assert plane.plane_store.snapshot()
    offline.clear(); plane.node_operation_lock.acquire()
    plane._teardown_worker(job)
    assert job['status'] == 'done' and plane.plane_state['mode'] == 'removed'
    assert calls == ['n1','n2','n2'] and plane.plane_store.snapshot() == {}


@pytest.mark.parametrize('mode,expected', [('standalone', []), ('resuming', ['https://10.88.0.1:2389'])])
def test_agent_configuration_reconnects_etcd_during_resume(mode, expected):
    from meshctl.ops import Ops
    plane = Ops(); plane.cfg = {'mesh': {}}; plane.plane_state = {'mode':mode}
    files = {}
    class Node:
        def put(self, path, value, *args): files[path] = value
        def run(self, *args, **kwargs): pass
    plane.install_agent(Node(), 'n1', '10.88.0.1', {}, ['https://10.88.0.1:2389'])
    assert json.loads(files['/etc/meshagent/config.json'])['etcd'] == expected


def test_pausing_stops_registered_learners_too(tmp_path, monkeypatch):
    plane = Plane(tmp_path); plane.ssh = None
    plane.mesh = {'nodes': {'n4': {'overlay':'10.88.0.4'}}}
    plane._member_records = lambda members: [{'name':f'n{i}'} for i in range(1,4)]
    stopped = []
    class Node:
        def __init__(self, name, *args): self.name = name
        def run(self, *args, **kwargs): stopped.append(self.name)
    monkeypatch.setattr('meshctl.provision.Node', Node)
    plane.pause_etcd('n3', [{'name':'', 'isLearner':True, 'peerURLs':['https://10.88.0.4:2381']}], {})
    assert stopped == ['n1','n2','n3','n4']
    assert len(plane.plane_state['desired_members']) == 2


def test_fresh_empty_controller_creates_a_stable_private_ca(tmp_path, monkeypatch):
    from meshctl.app import Mesh
    monkeypatch.setenv('MESHCTL_STATE_DIR', str(tmp_path))
    cfg = {'entries':{}, 'exits':{}, 'mesh':{}}
    mesh = Mesh(cfg, None, None)
    assert mesh.standalone() and mesh.plane_state['desired_members'] == []
    ca = (tmp_path/'pki'/'ca.crt').read_bytes()
    mesh = Mesh({'entries':{}, 'exits':{}, 'mesh':{}}, None, None)
    assert (tmp_path/'pki'/'ca.crt').read_bytes() == ca
    assert (tmp_path/'pki'/'ca.key').stat().st_mode & 0o777 == 0o600


def test_reconfiguring_an_existing_agent_preserves_its_wireguard_key_path():
    from meshctl.ops import Ops
    plane = Ops(); plane.cfg = {'mesh': {}}; plane.plane_state = {'mode':'resuming'}
    files = {}
    class Node:
        def put(self, path, value, *args): files[path] = value
        def run(self, *args, **kwargs): pass
    plane.install_agent(Node(), 'n1', '10.88.0.1', {}, ['https://10.88.0.1:2389'], key_file='/etc/wireguard/existing.key')
    assert json.loads(files['/etc/meshagent/config.json'])['key_file'] == '/etc/wireguard/existing.key'

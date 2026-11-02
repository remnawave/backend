import base64
import copy
import json
import threading

import pytest

from meshctl.ops import Ops
from meshctl.selection import select_balancer


class FakeRw:
    def __init__(self, owner):
        self.owner = owner
        self.hosts = [{'uuid': n, 'nodes': ['node'], 'address': 'exit.example', 'port': p}
                      for n, p in [('a', 4433), ('b', 8443)]]
        self.fail_after_patch = False

    def req(self, method, path, body=None):
        if method == 'GET':
            return copy.deepcopy([{'uuid': 'node', 'name': 'EXIT'}] if path == '/api/nodes' else self.hosts)
        assert self.owner.db['x'].get('operation'), 'mutation without durable recovery journal'
        self.owner.effects.append(('patch', copy.deepcopy(body)))
        next(h for h in self.hosts if h['uuid'] == body['uuid']).update(body)
        if self.fail_after_patch:
            self.fail_after_patch = False
            raise RuntimeError('connection lost after server applied patch')


class FakeMesh(Ops):
    def __init__(self, db=None, hosts=None):
        self.cfg = {'entries': {}, 'exits': {'x': {'rw_node': 'EXIT', 'wg_ip': '10.88.0.1', 'relay_slot': 0}},
                    'relay_address': 'relay.example'}
        self.lock = threading.Lock()
        self.flags = {}
        self.init_ops()
        self.db = copy.deepcopy(db or {})
        self.rw = FakeRw(self)
        if hosts is not None:
            self.rw.hosts = copy.deepcopy(hosts)
        self.effects = []
        self.store_calls = 0
        self.fail_store_at = None
        self.fail_forward = False

    def etcd_rpc(self, path, body):
        return {'kvs': [{'key': base64.b64encode(('/mesh/relay/' + n).encode()).decode(),
                         'value': base64.b64encode(json.dumps(v).encode()).decode()} for n, v in self.db.items()]}

    def etcd_put(self, key, value):
        self.store_calls += 1
        if self.store_calls == self.fail_store_at:
            raise RuntimeError('etcd unavailable')
        self.db[key.rsplit('/', 1)[1]] = copy.deepcopy(value)

    def push_meshfwd(self, rules):
        assert self.db['x'].get('operation'), 'forwarding before recovery journal'
        self.effects.append(('forward', copy.deepcopy(rules)))
        if self.fail_forward:
            self.fail_forward = False
            return False
        return True

    def event(self, *args):
        pass


def restart(mesh):
    return FakeMesh(mesh.db, mesh.rw.hosts)


def assert_direct(mesh):
    assert [(h['address'], h['port']) for h in mesh.rw.hosts] == [('exit.example', 4433), ('exit.example', 8443)]
    assert not mesh.db['x']['on'] and mesh.db['x']['saved'] == [] and 'operation' not in mesh.db['x']


def test_save_plan_before_any_mutation_and_fail_closed_without_etcd():
    m = FakeMesh()
    m.fail_store_at = 1
    with pytest.raises(RuntimeError):
        m.set_relay('x', True)
    assert m.effects == []


def test_restart_after_partial_host_update_preserves_every_original():
    m = FakeMesh()
    m.rw.fail_after_patch = True
    with pytest.raises(RuntimeError):
        m.set_relay('x', True)
    assert len(m.db['x']['saved']) == 2
    m = restart(m)
    m.set_relay('x', True)
    assert m.db['x']['on'] and len(m.db['x']['saved']) == 2
    m.set_relay('x', False)
    assert_direct(m)


def test_failed_final_commit_after_all_hosts_switched_is_recoverable():
    m = FakeMesh()
    m.fail_store_at = 2
    with pytest.raises(RuntimeError):
        m.set_relay('x', True)
    m = restart(m)
    m.set_relay('x', False)  # finish old journal, then honor the new opposite request
    assert_direct(m)


def test_failed_forward_keeps_plan_and_restores_on_retry():
    m = FakeMesh()
    m.fail_forward = True
    with pytest.raises(RuntimeError):
        m.set_relay('x', True)
    m = restart(m)
    m.set_relay('x', True)
    m.fail_forward = True
    with pytest.raises(RuntimeError):
        m.set_relay('x', False)
    assert m.db['x']['operation']['target'] is False and len(m.db['x']['saved']) == 2
    m = restart(m)
    m.set_relay('x', False)
    assert_direct(m)


def test_recovery_does_not_overwrite_external_host_edit():
    m = FakeMesh()
    m.fail_forward = True
    with pytest.raises(RuntimeError):
        m.set_relay('x', True)
    m.rw.hosts[0]['address'] = 'admin-change.example'
    m = restart(m)
    with pytest.raises(RuntimeError, match='changed outside'):
        m.set_relay('x', True)
    assert m.rw.hosts[0]['address'] == 'admin-change.example'
    assert len(m.db['x']['saved']) == 2


def test_legacy_originals_can_still_be_restored():
    m = FakeMesh()
    m.set_relay('x', True)
    for saved in m.db['x']['saved']:
        saved.pop('new_address', None)
        saved.pop('new_port', None)
    m = restart(m)
    m.set_relay('x', False)
    assert_direct(m)


def test_stale_automatic_decision_cannot_override_forced_mode():
    m = FakeMesh()
    m.flags = {'relay_modes': {'x': 'direct'}}
    m.set_relay('x', True, expected_mode='auto')
    assert m.effects == [] and m.db == {}


def test_balancer_selection_is_explicit_unique_and_independent_of_order():
    items = [{'uuid': 'other', 'name': 'Other'}, {'uuid': 'ru', 'name': 'Example-Balancer'}]
    assert select_balancer(items, name='Example-Balancer')['uuid'] == 'ru'
    assert select_balancer(items[::-1], uuid='ru')['uuid'] == 'ru'
    for args in [{}, {'name': 'missing'}, {'uuid': 'ru', 'name': 'Other'}]:
        with pytest.raises(ValueError):
            select_balancer(items, **args)
    with pytest.raises(ValueError):
        select_balancer(items + [dict(items[1], uuid='duplicate')], name='Example-Balancer')

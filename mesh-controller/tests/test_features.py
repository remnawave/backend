from meshctl.ipwatch import IpWatch, is_public
from meshctl.onboard import allocate_overlay, validate_host, validate_name
from meshctl.relay import forward_rules, host_rewrites, next_slot, relay_port, wants_relay


def test_relay_ports_are_stable_and_distinct():
    assert relay_port(0, 4433) == 45000 and relay_port(0, 5443) == 45006
    assert relay_port(2, 13446) == 45205
    assert relay_port(0, 9999) is None
    all_ports = [relay_port(s, p) for s in range(10) for p in (4433, 4434, 4435, 4436, 8443, 13446, 5443)]
    assert len(all_ports) == len(set(all_ports)) and max(all_ports) < 65535


def test_forward_rules_protocols():
    r = {real: proto for proto, _rp, real in forward_rules(1)}
    assert r[5443] == "udp" and r[4433] == "tcp"


def test_next_slot_fills_gaps():
    assert next_slot({0, 1, 3}) == 2 and next_slot(set()) == 0


def test_wants_relay_logic():
    ex = {"relay_slot": 0, "wg_ip": "10.88.0.13", "rw_node": "Example-Exit"}
    assert wants_relay(ex, False, True) is True          # direct dead, overlay alive -> on
    assert wants_relay(ex, True, True) is False          # direct back -> off
    assert wants_relay(ex, False, False) is None         # nothing works: no relay helps
    assert wants_relay(ex, None, True) is None           # no data yet
    assert wants_relay({**ex, "relay": "legacy"}, False, True) is None
    assert wants_relay({**ex, "relay_slot": None}, False, True) is None
    assert wants_relay({"relay_slot": 0, "rw_node": "x"}, False, True) is None   # no overlay address


def test_host_rewrites_only_pinned_known_ports():
    hosts = [
        {"uuid": "a", "address": "it.x", "port": 4433, "nodes": ["N1"]},
        {"uuid": "b", "address": "it.x", "port": 7777, "nodes": ["N1"]},        # unknown port: leave
        {"uuid": "c", "address": "lb.x", "port": 4433, "nodes": []},            # balancer host
        {"uuid": "d", "address": "ru.x", "port": 45000, "nodes": ["N1"]},       # already relayed
    ]
    r = host_rewrites(hosts, "N1", "ru.x", 0)
    assert [x["uuid"] for x in r] == ["a"] and r[0]["new_port"] == 45000 and r[0]["address"] == "it.x"


def test_ipwatch_needs_consecutive_reports():
    w = IpWatch(need=3)
    reg = {"it": "1.1.1.1"}
    assert w.observe(reg, {"it": "8.8.8.8"}) == []
    assert w.observe(reg, {"it": "8.8.8.8"}) == []
    assert w.observe(reg, {"it": "8.8.8.8"}) == [("it", "1.1.1.1", "8.8.8.8")]


def test_ipwatch_resets_on_flap_and_ignores_private():
    w = IpWatch(need=3)
    reg = {"it": "1.1.1.1"}
    w.observe(reg, {"it": "8.8.8.8"}); w.observe(reg, {"it": "8.8.8.8"})
    w.observe(reg, {"it": "9.9.9.9"})                       # flapped to another address: restart
    assert w.observe(reg, {"it": "9.9.9.9"}) == []
    assert w.observe(reg, {"it": "10.0.0.5"}) == []         # private: ignored
    assert w.observe(reg, {"it": "1.1.1.1"}) == []          # back to registered: nothing
    assert not is_public("192.168.0.1") and is_public("8.8.8.8")


def test_onboarding_validation_and_allocation():
    assert validate_name("de2", ["dee"]) is None
    assert validate_name("dee", ["dee"]) is not None
    assert validate_name("Bad_Name", []) is not None and validate_name("toolongname", []) is not None
    assert validate_host("8.8.8.8") is None and validate_host("10.0.0.1") is not None and validate_host("a.b") is not None
    used = ["10.88.0.1", "10.88.0.2", "10.88.0.11", "10.88.0.12"]
    assert allocate_overlay(used, "exit") == "10.88.0.16"
    assert allocate_overlay(used, "entry") == "10.88.0.3"
    assert allocate_overlay(used + ["10.88.0.16"], "exit") == "10.88.0.17"


def test_meshfwd_commands():
    import importlib.util, pathlib
    spec = importlib.util.spec_from_file_location("meshfwd", pathlib.Path(__file__).resolve().parent.parent / "agent" / "meshfwd.py")
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    cmds = m.build_commands([{"id": "it", "target": "10.88.0.13", "maps": [["tcp", 45000, 4433], ["udp", 45006, 5443]]}])
    flat = [" ".join(c) for c in cmds]
    assert "-t nat -A MESHFWD -p tcp --dport 45000 -j DNAT --to-destination 10.88.0.13:4433" in flat
    assert "-t nat -A MESHFWD -p udp --dport 45006 -j DNAT --to-destination 10.88.0.13:5443" in flat
    assert any("MESHFWD_FW" in c and "-s 10.88.0.13" in c for c in flat)           # return traffic allowed
    assert sum("TCPMSS" in c for c in flat) == 2                                    # clamp once per direction, per exit
    assert m.build_commands([]) == []                                               # empty rules -> nothing (chains stay flushed)

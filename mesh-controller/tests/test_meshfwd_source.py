import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("meshfwd_source_test", Path(__file__).parents[1] / "agent/meshfwd.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SourceNatTest(unittest.TestCase):
    def test_stable_return_address_for_tcp_and_udp(self):
        rules = [{"target": "10.88.0.13", "maps": [["tcp", 45000, 4433], ["udp", 45006, 5443]]}]
        commands = module.build_commands(rules, "10.88.0.1")
        nat = [c for c in commands if "MESHFWD_POST" in c]
        self.assertEqual(len(nat), 2)
        self.assertTrue(all(c[-3:] == ["SNAT", "--to-source", "10.88.0.1"] for c in nat))
        self.assertTrue(any("10.88.0.13:4433" in c for c in commands))
        self.assertTrue(any("10.88.0.13:5443" in c for c in commands))

    def test_rejects_unroutable_link_source(self):
        for address in ["10.89.1.14", "203.0.113.30", "10.88.0.0", "10.88.0.255", "invalid"]:
            with self.assertRaises(ValueError):
                module.build_commands([], address)

class SharedHostSafetyTest(unittest.TestCase):
    def test_relay_does_not_capture_shared_balancer_hosts(self):
        from meshctl.relay import host_rewrites
        hosts = [
            {"uuid": "shared", "nodes": ["N1", "N2"], "address": "lb.example", "port": 4433},
            {"uuid": "pinned", "nodes": ["N1"], "address": "node.example", "port": 4433},
        ]
        self.assertEqual([h["uuid"] for h in host_rewrites(hosts, "N1", "ru.example", 0)], ["pinned"])

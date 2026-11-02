from meshctl.core import (ExitState, Hysteresis, PathResult, build_probe_script, choose_path,
                          exit_ok_from_entries, parse_probe_output)


def test_parse_aggregates_ports():
    out = "P|es|direct|4433|0|0\nP|es|direct|8443|1|120\nP|es|wg|4433|3|70\nnoise\n"
    r = parse_probe_output(out)
    assert r["es"]["direct"].ok == 1 and r["es"]["direct"].total == 6
    assert r["es"]["wg"].ratio == 1.0 and r["es"]["direct"].ms == 120


def test_script_contains_all_targets():
    s = build_probe_script({"a": {"public_ip": "1.1.1.1", "wg_ip": "10.0.0.2"}, "b": {"public_ip": "2.2.2.2"}}, [4433], "x.t")
    assert "probe a 1.1.1.1 4433 direct &" in s and "probe a 10.0.0.2 4433 wg &" in s
    assert "probe b 2.2.2.2 4433 direct &" in s and "wg" not in s.split("probe b")[1].splitlines()[0]
    assert s.rstrip().endswith("wait")


def test_hysteresis_needs_streak():
    h = Hysteresis(down_after=3, up_after=2)
    assert h.observe(True) is True
    assert h.observe(False) is True and h.observe(False) is True
    assert h.observe(False) is False          # third consecutive failure flips
    assert h.observe(True) is False           # one success is not enough
    assert h.observe(True) is True


def test_hysteresis_streak_resets():
    h = Hysteresis(down_after=3, up_after=2)
    h.observe(True)
    h.observe(False); h.observe(False); h.observe(True)   # streak broken
    assert h.observe(False) is True


def test_exit_ok_requires_all_entries_and_ignores_missing():
    good, bad = PathResult(3, 3), PathResult(0, 3)
    m = {"ru1": {"es": {"direct": good}}, "ru2": {"es": {"direct": bad}}}
    assert exit_ok_from_entries(m, "es", "direct", 0.67) is False
    assert exit_ok_from_entries({"ru1": {"es": {"direct": good}}}, "es", "direct", 0.67) is True
    assert exit_ok_from_entries({}, "es", "direct", 0.67) is None


def test_choose_path():
    assert choose_path(True, True, "wg") == "direct"
    assert choose_path(False, True, "direct") == "wg"
    assert choose_path(False, False, "wg") == "wg"
    assert choose_path(None, None, "direct") == "direct"

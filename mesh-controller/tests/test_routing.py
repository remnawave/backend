from meshctl.routing import LinkTracker, allowed_ips, edge_ok, next_hops

NODES = ["ru1", "ru2", "uk", "dee"]
OVERLAY = {"ru1": "10.88.0.1", "ru2": "10.88.0.2", "uk": "10.88.0.12", "dee": "10.88.0.14"}


def full_mesh(down=()):
    """Everyone sees everyone, except the listed undirected links."""
    obs = {}
    for a in NODES:
        for b in NODES:
            if a == b or frozenset((a, b)) in {frozenset(x) for x in down}:
                continue
            obs.setdefault(a, {})[b] = {"ok": True, "rtt": 40.0}
    return obs


def test_direct_when_all_healthy():
    h = next_hops(NODES, full_mesh(), "ru1")
    assert all(v is None for v in h.values())


def test_transit_when_direct_link_dies():
    obs = full_mesh(down=[("ru1", "uk")])
    assert next_hops(NODES, obs, "ru1")["uk"] in ("ru2", "dee")


def test_both_ends_choose_same_transit():
    obs = full_mesh(down=[("ru1", "uk")])
    assert next_hops(NODES, obs, "ru1")["uk"] == next_hops(NODES, obs, "uk")["ru1"]


def test_allowed_ips_include_routed_destination():
    obs = full_mesh(down=[("ru1", "uk")])
    hops = next_hops(NODES, obs, "ru1")
    ips = allowed_ips("ru1", OVERLAY, hops)
    via = hops["uk"]
    assert OVERLAY["uk"] + "/32" in ips[via]
    assert ips["uk"] == []                       # moved away from the dead direct peer
    owners = [p for p, v in ips.items() if OVERLAY["uk"] + "/32" in v]
    assert owners == [via]                       # exactly one owner per address


def test_one_way_blackhole_counts_as_dead_link():
    obs = full_mesh()
    obs["uk"]["ru1"]["ok"] = False          # uk stops hearing ru1
    assert not edge_ok(obs, "ru1", "uk")
    assert next_hops(NODES, obs, "ru1")["uk"] is not None


def test_missing_reporter_is_treated_as_down():
    obs = full_mesh()
    del obs["dee"]                          # agent dead, lease expired
    assert not edge_ok(obs, "ru1", "dee")
    # nothing else can reach dee either: stays direct (None) and keeps trying
    assert next_hops(NODES, obs, "ru1")["dee"] is None


def test_unreachable_stays_direct():
    obs = full_mesh(down=[("ru1", "uk"), ("ru2", "uk"), ("dee", "uk")])
    assert next_hops(NODES, obs, "ru1")["uk"] is None


def test_link_tracker_hysteresis():
    t = LinkTracker(down_after=3, up_after=2)
    assert t.update(False) and t.update(False)
    assert t.update(False) is False
    assert t.update(True) is False
    assert t.update(True) is True


def test_transit_choice_ignores_latency_and_follows_priority():
    obs = full_mesh(down=[("ru1", "uk")])
    for a in obs:
        for b in obs[a]:
            obs[a][b]["rtt"] = 500.0 if b == "dee" else 5.0      # latency must not matter
    plain = next_hops(NODES, obs, "ru1")["uk"]
    assert plain == "dee"                                        # alphabetical among equals
    assert next_hops(NODES, obs, "ru1", {"dee": 5})["uk"] == "ru2"
    assert next_hops(NODES, obs, "uk", {"dee": 5})["ru1"] == "ru2"   # same answer from the other end


def test_quality_prefers_lower_latency_but_respects_admin_priority():
    obs = full_mesh(down=[('ru1', 'uk')])
    for a in obs:
        for b in obs[a]: obs[a][b]['rtt'] = 200 if 'dee' in (a,b) else 10
    assert next_hops(NODES,obs,'ru1',quality=True)['uk'] == 'ru2'
    assert next_hops(NODES,obs,'uk',quality=True)['ru1'] == 'ru2'
    assert next_hops(NODES,obs,'ru1',{'ru2':5},quality=True)['uk'] == 'dee'


def test_quality_avoids_loss_and_overloaded_transit():
    obs = full_mesh(down=[('ru1','uk')])
    assert next_hops(NODES,obs,'ru1',quality=True,loads={'dee':2})['uk'] == 'ru2'
    obs['ru1']['dee']['loss'] = .25
    assert next_hops(NODES,obs,'ru1',quality=True)['uk'] == 'ru2'


def test_quality_hysteresis_keeps_small_improvements_but_fails_over_immediately():
    obs = full_mesh(down=[('ru1','uk')])
    for a in obs:
        for b in obs[a]: obs[a][b]['rtt'] = 45 if 'dee' in (a,b) else 40
    assert next_hops(NODES,obs,'ru1',quality=True,current={'uk':'dee'})['uk'] == 'dee'
    obs['dee']['uk']['ok'] = False
    assert next_hops(NODES,obs,'ru1',quality=True,current={'uk':'dee'})['uk'] == 'ru2'


def test_quality_smoothing_and_loss_window():
    from meshctl.routing import LinkQuality
    q=LinkQuality()
    assert q.update(100)['rtt']==100
    assert q.update(200)['rtt']==130
    assert q.update(None)['loss']==.333
    for _ in range(12): q.update(100)
    assert q.update(100)['loss']==0

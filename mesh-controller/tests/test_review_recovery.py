"""Regression cases from the mesh lifecycle/security review."""
import base64
import copy
import importlib.util
import json
from pathlib import Path
import threading
from types import SimpleNamespace

import pytest
from meshctl import records
from meshctl.app import Mesh, Ssh
from meshctl.core import build_probe_script
from meshctl.ops import Ops
from meshctl.mtls import Migration
from meshctl.standalone_store import atomic_json, encoded

PUBLIC_KEY = base64.b64encode(bytes(range(32))).decode()
DOC = {'overlay':'10.88.0.16','underlay':'198.51.100.2','pubkey':PUBLIC_KEY}
INV = {'overlay':DOC['overlay'],'host':DOC['underlay'],'user':'root','role':'exit','rw_node':'VPN','slot':0}


def agent_module():
    spec = importlib.util.spec_from_file_location('review_agent', Path(__file__).parents[1]/'agent/meshagent.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize('field,value', [('underlay','$(touch /tmp/owned)'),('overlay','10.88.0.2; id'),('pubkey','$(id)'),('prio','0; id')])
def test_hostile_shared_records_are_rejected_before_commands(field,value,tmp_path,monkeypatch):
    module = agent_module()
    monkeypatch.setattr(module.subprocess, 'run', lambda *a,**k: pytest.fail('no command may run for a malformed record'))
    path=tmp_path/'nodes.json';path.write_text(json.dumps({'aa':dict(DOC,**{field:value})}))
    with pytest.raises((ValueError,KeyError)):
        module.Agent({'name':'aa','overlay':'10.88.0.16','nodes_file':str(path)})


def test_discovered_endpoints_and_inventory_cannot_inject_shell_commands():
    with pytest.raises(ValueError): records.endpoint('https://10.88.0.16:2389; id', {'aa':DOC})
    with pytest.raises(ValueError): records.inventory({'aa':dict(INV,host='1.2.3.4; id')})
    with pytest.raises(ValueError): records.inventory({'aa':dict(INV,user='root; id')})
    with pytest.raises(ValueError): build_probe_script({'aa':{'public_ip':'$(id)'}}, [443], 'example.test')
    with pytest.raises(ValueError): build_probe_script({'aa':{'public_ip':'1.1.1.1'}}, [443], '$(id)')


def test_agent_uses_argv_and_scoped_firewall_before_bringing_links_up(tmp_path,monkeypatch):
    module=agent_module();calls=[]
    def command(args, **kwargs):
        assert isinstance(args,list) and not kwargs.get('shell')
        calls.append((args,kwargs))
        return SimpleNamespace(returncode=1 if args[0]=='iptables' and args[1] in ('-C','-S') else 0,stdout='',stderr='')
    monkeypatch.setattr(module.subprocess,'run',command)
    path=tmp_path/'nodes.json';path.write_text(json.dumps({'aa':DOC,'bb':dict(DOC,overlay='10.88.0.17')}))
    agent=module.Agent({'name':'aa','overlay':DOC['overlay'],'key_file':'/etc/wireguard/existing.key','nodes_file':str(path)})
    agent.ensure_links()
    firewall=next(kwargs['input'] for args,kwargs in calls if args[0]=='iptables-restore')
    assert '-i wgm+ -j DROP' in firewall and '-o wgm+ -j DROP' in firewall
    assert '-s 10.88.0.0/24 -d 10.88.0.0/24' in firewall
    assert '--ctstate DNAT' in firewall and 'ESTABLISHED,RELATED' in firewall
    wg=next(args for args,_ in calls if args[0]=='wg')
    assert wg[wg.index('allowed-ips')+1]=='10.88.0.0/24,10.89.0.0/16'
    assert calls.index(next(c for c in calls if c[0][0]=='iptables-restore')) < calls.index(next(c for c in calls if c[0][0]=='wg'))


class Model(Ops):
    def __init__(self,tmp_path,monkeypatch):
        monkeypatch.setenv('MESHCTL_STATE_DIR',str(tmp_path))
        self.cfg={'entries':{},'exits':{'aa':{'public_ip':DOC['underlay'],'wg_ip':DOC['overlay'],'rw_node':'VPN','relay_slot':0}},'mesh':{}}
        self.lock=threading.Lock();self.agent_ts={};self.state={};self.mesh={'nodes':{'aa':copy.deepcopy(DOC)},'etcd_up':True,'obs':{},'route':{}}
        self.wake=threading.Event();self.ssh=None
        self.init_ops()
        self.inventory={'aa':copy.deepcopy(INV)};self.deleted=[];self.db={'/mesh/nodes/aa':copy.deepcopy(DOC)}
    def event(self,*args): pass
    def etcd_del(self,key): self.deleted.append(key);self.db.pop(key,None)
    def etcd_put(self,key,value): self.db[key]=copy.deepcopy(value)
    def etcd_live_rpc(self,path,body): return {'members':[]}


def test_offline_individual_removal_survives_restart_and_remains_retryable(tmp_path,monkeypatch):
    model=Model(tmp_path,monkeypatch);offline={'aa'};commands=[]
    class Node:
        def __init__(self,name,*args):self.name=name
        def run(self,cmd,**kwargs):
            commands.append(cmd)
            if self.name in offline:raise OSError('offline')
    monkeypatch.setattr('meshctl.provision.Node',Node)
    job={'steps':[]};model._remove_run(job,'aa')
    assert job['status']=='failed' and 'aa' in model.inventory
    assert 'aa' in json.loads(model.plane_path.read_text())['node_cleanup']
    assert '/mesh/inventory/aa' not in model.deleted
    model=Model(tmp_path,monkeypatch)
    model.mesh['nodes']={}
    assert model.all_node_specs()['aa']['overlay']==DOC['overlay'], 'full teardown must retain the orphan target'
    offline.clear();model._remove_run(job,'aa')
    assert job['status']=='done' and not model.plane_state['node_cleanup']
    assert 'meshagent meshfwd' in commands[-1] and 'MESHFWD_FW' in commands[-1] and 'MESHAGENT_FW' in commands[-1]


def test_pending_relay_restoration_must_finish_before_removal(tmp_path,monkeypatch):
    model=Model(tmp_path,monkeypatch);model.relay_state={'aa':{'on':False,'operation':{'target':True}}}
    def unavailable(*args,**kwargs):raise RuntimeError('panel unavailable')
    model.set_relay=unavailable;job={'steps':[]};model._remove_run(job,'aa')
    assert job['status']=='failed' and model.deleted==[]
    assert model.plane_state['node_cleanup']['aa']['phase']=='restore'
    model.rebuild_cfg();assert 'aa' in model.cfg['exits']
    model.set_relay=lambda *a,**k:model.relay_state.update(aa={'on':False})
    monkeypatch.setattr('meshctl.provision.Node',lambda *a:SimpleNamespace(run=lambda *a,**k:''))
    model._remove_run(job,'aa');assert job['status']=='done'


def test_live_learner_and_pending_membership_cannot_be_removed_as_mesh_only(tmp_path,monkeypatch):
    model=Model(tmp_path,monkeypatch)
    model.etcd_live_rpc=lambda *a:{'members':[{'name':'','isLearner':True,'peerURLs':['https://10.88.0.16:2381']}]}
    with pytest.raises(ValueError,match='learner'):model.start_remove('aa')
    assert not model.node_operation_lock.locked() and model.deleted==[]
    model.control['operation']={'name':'aa','stage':'promoting'}
    with pytest.raises(ValueError,match='pending'):model.start_remove('aa')


@pytest.mark.parametrize('failure',['panel','dns','ipmap'])
def test_ip_update_retries_after_restart_even_when_detection_no_longer_proposes_it(tmp_path,monkeypatch,failure):
    model=Model(tmp_path,monkeypatch);new='203.0.113.3';old=DOC['underlay'];effects=[];fail={failure}
    node={'name':'VPN','uuid':'vpn-id','address':old}
    def request(method,path,body=None):
        assert model.ip_updates_path.exists()
        if method=='GET':return [dict(node)]
        node['address']=body['address'];effects.append('panel')
        if 'panel' in fail:fail.remove('panel');raise RuntimeError('response lost after patch')
    rw=SimpleNamespace(req=request)
    model.rw=rw;model.ssh=SimpleNamespace(verify_host_move=lambda *a:effects.append('verified'))
    def dns(*a):
        if 'dns' in fail:fail.remove('dns');raise RuntimeError('DNS unavailable')
        effects.append('dns')
    model.cloudflare_update=dns
    def write(key,value):
        model.db[key]=copy.deepcopy(value)
        if key.startswith('/mesh/ipmap/') and 'ipmap' in fail:
            fail.remove('ipmap');raise RuntimeError('lost etcd reply')
    model.etcd_put=write
    with pytest.raises(RuntimeError):model.handle_ip_change('aa',old,new)
    assert json.loads(model.ip_updates_path.read_text())['aa']['new']==new
    pending=copy.deepcopy(model.ip_updates)
    model=Model(tmp_path,monkeypatch);model.ip_updates=pending;model.rw=rw
    model.ssh=SimpleNamespace(verify_host_move=lambda *a:pytest.fail('verified trust must survive retry'))
    model.cloudflare_update=dns;model.etcd_put=write
    model.mesh['nodes']['aa']['underlay']=new # detector now sees the new address already registered
    model.reported_ip={'aa':new};model.cfg['auto_ip_update']=False
    model.manage_ips()
    assert model.ip_updates=={} and json.loads(model.ip_updates_path.read_text())=={}
    assert model.ipmap['aa']['ip']==new and node['address']==new
    assert effects.count('verified')==1 and effects.count('panel')==1 and 'dns' in effects


@pytest.mark.parametrize('matches',[False,True])
def test_address_move_requires_the_same_previously_pinned_ssh_host_key(tmp_path,monkeypatch,matches):
    import paramiko
    key=paramiko.RSAKey.generate(1024);other=paramiko.RSAKey.generate(1024)
    known=tmp_path/'known';known.write_text('198.51.100.2 '+key.get_name()+' '+key.get_base64()+'\n')
    monkeypatch.setenv('MESHCTL_KNOWN_HOSTS',str(known));monkeypatch.setenv('MESHCTL_STATE_DIR',str(tmp_path/'state'))
    monkeypatch.setattr(paramiko.Ed25519Key,'from_private_key_file',lambda p:None)
    def connect(client,hostname,**kwargs):
        remote=key if matches else other
        client._policy.missing_host_key(client,hostname,remote);client.review_key=remote
    monkeypatch.setattr(paramiko.SSHClient,'connect',connect)
    monkeypatch.setattr(paramiko.SSHClient,'get_transport',lambda client:SimpleNamespace(get_remote_server_key=lambda:client.review_key))
    ssh=Ssh('/unused')
    if matches:
        ssh.verify_host_move('198.51.100.2','203.0.113.3','root')
        assert ssh.client().get_host_keys().lookup('203.0.113.3')[key.get_name()]==key
    else:
        with pytest.raises(paramiko.SSHException):ssh.verify_host_move('198.51.100.2','203.0.113.3','root')
        assert not ssh.trusted_hosts.exists()


def test_interrupted_resume_retries_stops_before_declaring_standalone(tmp_path,monkeypatch):
    monkeypatch.setenv('MESHCTL_STATE_DIR',str(tmp_path))
    mesh=Mesh({'entries':{},'exits':{},'mesh':{}},None,None)
    member={'name':'aa','host':INV['host'],'user':'root','overlay':DOC['overlay'],'client_url':'https://10.88.0.16:2389','peer_url':'https://10.88.0.16:2381'}
    mesh.plane_store.seed({'/mesh/nodes/aa':DOC,'/mesh/inventory/aa':INV})
    mesh.save_plane(mode='resuming',desired_members=[member],resume_members=[member])
    restarted=Mesh({'entries':{},'exits':{},'mesh':{}},None,None)
    assert restarted.plane_state['mode']=='pausing' and restarted.plane_state['stop_pending']==['aa']
    stopped=[];fail=[True]
    class Node:
        def __init__(self,name,*a):self.name=name
        def run(self,*a,**k):
            if fail[0]:raise OSError('offline')
            stopped.append(self.name)
    monkeypatch.setattr('meshctl.provision.Node',Node)
    restarted.sync_standalone=lambda **k:None;restarted.event=lambda *a:None
    with pytest.raises(RuntimeError):restarted.read_mesh()
    assert restarted.plane_state['mode']=='pausing'
    fail[0]=False;restarted.load_standalone=lambda **k:None
    restarted.read_mesh()
    assert restarted.plane_state['mode']=='standalone' and stopped==['aa']


def test_mtls_agent_migration_preserves_the_existing_wireguard_key_path():
    migration=Migration.__new__(Migration);calls=[]
    migration.nodes={'aa':SimpleNamespace(run=lambda cmd:json.dumps({'key_file':'/etc/wireguard/original.key'}))}
    migration.registry={'aa':DOC};migration.target={'mesh':{'etcd_endpoints':['https://10.88.0.16:2389']}}
    migration.mesh=SimpleNamespace(install_agent=lambda *a,**k:calls.append(k))
    migration.wait_all=lambda:None;migration.verify_agents=lambda:None
    migration.agents()
    assert calls==[{'key_file':'/etc/wireguard/original.key'}]


def test_pending_address_update_cannot_be_orphaned_by_teardown_or_membership_change(tmp_path,monkeypatch):
    model=Model(tmp_path,monkeypatch);model.ip_updates={'aa':{'old':DOC['underlay'],'new':'203.0.113.3'}}
    with pytest.raises(ValueError,match='pending IP'):model.start_remove('aa')
    with pytest.raises(ValueError,match='pending IP'):model.start_teardown()
    with pytest.raises(ValueError,match='pending IP'):model.start_etcd_change('aa',True)
    assert not model.node_operation_lock.locked()


def test_dns_provider_error_in_successful_http_response_is_not_treated_as_completion(tmp_path,monkeypatch):
    model=Model(tmp_path,monkeypatch);model.cfg['cloudflare_zone']='example.test'
    monkeypatch.setenv('CF_API_TOKEN','test-only')
    responses=[{'success':True,'result':[{'id':'zone'}]}, {'success':True,'result':[{'id':'record','name':'vpn.example.test'}]}, {'success':False,'errors':[{'message':'rejected'}]}]
    def request(method,url,**kwargs):
        assert url.startswith('https://api.cloudflare.com/client/v4/')
        result=responses.pop(0)
        return SimpleNamespace(raise_for_status=lambda:None,json=lambda:result)
    monkeypatch.setattr('meshctl.ops.requests.request',request)
    with pytest.raises(RuntimeError,match='did not confirm'):model.cloudflare_update('198.51.100.2','203.0.113.3')


def test_standalone_restart_discards_live_discovery_for_a_removed_voter(tmp_path,monkeypatch):
    monkeypatch.setenv('MESHCTL_STATE_DIR',str(tmp_path))
    mesh=Mesh({'entries':{},'exits':{},'mesh':{}},None,None)
    members=[{'name':name,'host':f'198.51.100.{index}','user':'root',
              'client_url':f'https://10.88.0.{index}:2389','peer_url':f'https://10.88.0.{index}:2381'}
             for index,name in enumerate(('aa','bb','cc'),16)]
    values={f'/mesh/nodes/{m["name"]}':dict(DOC,overlay=f'10.88.0.{i}') for i,m in enumerate(members,16)}
    values['/mesh/control/etcd']={'members':members}
    mesh.plane_store.seed(values)
    mesh.save_plane(mode='standalone',desired_members=members[:2],paused_members=members,stop_pending=[])
    # A legacy paused snapshot may still contain the original discovery after removal.
    mesh.plane_store.rpc('/kv/deleterange',{'key':encoded('/mesh/nodes/cc')})
    restarted=Mesh({'entries':{},'exits':{},'mesh':{}},None,None)
    assert set(restarted.mesh['nodes'])=={'aa','bb'}
    assert [m['name'] for m in restarted.members()]==['aa','bb']
    assert len(restarted.plane_state['paused_members'])==3
    assert 'etcd' not in restarted.control
    assert '/mesh/control/etcd' not in restarted.plane_store.snapshot()
    restarted.load_standalone(collect=False)
    Mesh({'entries':{},'exits':{},'mesh':{}},None,None)


def test_retry_entry_cleanup_preserves_relays_on_surviving_entry(tmp_path,monkeypatch):
    model=Model(tmp_path,monkeypatch)
    model.inventory.update(bb=dict(INV,host='198.51.100.3',overlay='10.88.0.17',role='entry'),
                           cc=dict(INV,host='198.51.100.4',overlay='10.88.0.18',role='entry'))
    model.mesh['nodes'].update(bb=dict(DOC,underlay='198.51.100.3',overlay='10.88.0.17'),
                               cc=dict(DOC,underlay='198.51.100.4',overlay='10.88.0.18'))
    model.relay_state={'aa':{'on':True,'hosts':{'vpn':'original'}}}
    model.rebuild_cfg();offline=[True]
    class Node:
        def __init__(self,*a):pass
        def run(self,*a,**k):
            if offline[0]:raise OSError('offline')
    monkeypatch.setattr('meshctl.provision.Node',Node)
    model.set_relay=lambda *a,**k:pytest.fail('surviving entry must keep its working relay')
    job={'steps':[]};model._remove_run(job,'bb')
    assert job['status']=='failed'
    model.rebuild_cfg()
    assert set(model.cfg['entries'])=={'cc'}
    # Simulate restart: reload the durable phase, not just the in-memory object.
    model.plane_state=json.loads(model.plane_path.read_text())
    offline[0]=False;model._remove_run(job,'bb')
    assert job['status']=='done' and model.relay_state['aa']['on']
    assert set(model.cfg['entries'])=={'cc'}


def test_removed_bootstrap_node_stays_removed_but_can_be_explicitly_readded(tmp_path,monkeypatch):
    model=Model(tmp_path,monkeypatch)
    monkeypatch.setattr('meshctl.provision.Node',lambda *a:SimpleNamespace(run=lambda *a,**k:''))
    model._remove_run({'steps':[]},'aa')
    assert 'aa' not in model.cfg['exits']
    restarted=Model(tmp_path,monkeypatch);restarted.inventory={};restarted.mesh['nodes']={}
    restarted.rebuild_cfg()
    assert 'aa' not in restarted.cfg['exits']
    restarted.inventory={'aa':dict(INV,host='203.0.113.7')}
    restarted.rebuild_cfg()
    assert restarted.cfg['exits']['aa']['public_ip']=='203.0.113.7'

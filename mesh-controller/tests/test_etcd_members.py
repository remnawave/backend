import copy
import json
import threading
import pytest
from meshctl.etcd_members import EtcdMembers, check_removal


def voters(n):
    return [{'ID':str(i),'name':'n'+str(i),'isLearner':False,'peerURLs':['https://10.0.0.'+str(i)+':2381'],'clientURLs':['https://10.0.0.'+str(i)+':2389']} for i in range(1,n+1)]


def test_removal_preserves_minimum_and_learners_do_not_count():
    a=voters(3)
    with pytest.raises(ValueError):check_removal(a,a[0])
    learner=dict(a[0],ID='learner',name='joining',isLearner=True)
    with pytest.raises(ValueError):check_removal(a+[learner],a[0])
    assert check_removal(a+[learner],learner)==a
    a=voters(4);assert len(check_removal(a,a[0]))==3


class Control(EtcdMembers):
    def __init__(self,tmp_path):
        self.ssh=None
        self.cfg={'entries':{},'exits':{},'mesh':{'etcd_tls':{'enabled':True}}}
        self.init_etcd_control();self.seed_path=tmp_path/'state'/'etcd-seeds.json'
        self.current=voters(3);self.control={'operation':{'name':'n4','kind':'add','stage':'prepared','peer':'https://10.0.0.4:2381'}}
        self.mesh={'nodes':{'n4':{'overlay':'10.0.0.4'}}};self.inventory={};self.ipmap={};self.add_calls=0;self.remove_calls=0;self.fail_after_add=False;self.fail_after_remove=False
        self.records=[]
    def _node_spec(self,name):return {'host':'127.0.0.1','user':'root'}
    def _member_records(self,members):
        return [{'name':m['name'],'client_url':m['clientURLs'][0]} for m in members if not m.get('isLearner')]
    def _health(self,records,**kwargs):return [r['name'] for r in records]
    def etcd_put(self,path,value):pass
    def step(self,*args):pass
    def event(self,*args):pass
    def etcd_rpc(self,path,body):
        if path.endswith('/list'):return {'members':copy.deepcopy(self.current)}
        if path.endswith('/add'):
            self.add_calls+=1
            m={'ID':'4','name':'n4','isLearner':True,'peerURLs':body['peerURLs'],'clientURLs':['https://10.0.0.4:2389']};self.current.append(m)
            if self.fail_after_add:self.fail_after_add=False;raise RuntimeError('lost response after member was added')
            return {'member':copy.deepcopy(m),'members':copy.deepcopy(self.current)}
        if path.endswith('/promote'):
            next(m for m in self.current if m['ID']==body['ID'])['isLearner']=False
            return {}
        if path.endswith('/remove'):
            self.remove_calls+=1;self.current=[m for m in self.current if m['ID']!=body['ID']]
            if self.fail_after_remove:self.fail_after_remove=False;raise RuntimeError('lost response after removal')
            return {}
        raise AssertionError(path)


class Node:
    def __init__(self,*args):self.commands=[]
    def put(self,*args):pass
    def run(self,cmd,**kwargs):self.commands.append(cmd);return ''


def test_join_recovers_lost_add_response_without_duplicate_learner(tmp_path,monkeypatch):
    import meshctl.provision
    monkeypatch.setattr(meshctl.provision,'Node',Node)
    c=Control(tmp_path);c.fail_after_add=True
    with pytest.raises(RuntimeError):c.change_etcd('n4',True,{})
    assert len(c.current)==4 and c.current[-1]['isLearner']
    c.change_etcd('n4',True,{})
    assert c.add_calls==1 and not c.current[-1]['isLearner']
    assert c.control['operation']['stage']=='done'
    assert len(json.loads(c.seed_path.read_text())['members'])==4


def test_remove_recovers_lost_response_without_deleting_data(tmp_path,monkeypatch):
    import meshctl.provision
    monkeypatch.setattr(meshctl.provision,'Node',Node)
    c=Control(tmp_path);c.current=voters(4);c.control={};c.fail_after_remove=True
    with pytest.raises(RuntimeError):c.change_etcd('n4',False,{})
    assert len(c.current)==3 and c.control['operation']['stage']=='prepared'
    c.change_etcd('n4',False,{})
    assert c.remove_calls==1 and c.control['operation']['stage']=='done'
    assert len(json.loads(c.seed_path.read_text())['members'])==3


def test_seed_cache_is_atomic_and_private(tmp_path):
    c=Control(tmp_path);c._seed_cache({'members':[{'name':'uk'}]})
    assert json.loads(c.seed_path.read_text())['members']==[{'name':'uk'}]
    assert c.seed_path.stat().st_mode & 0o777 == 0o600


def test_member_requests_use_sudo_without_exposing_private_key_contents():
    from types import SimpleNamespace
    from meshctl.ops import Ops
    calls=[]
    c=Ops();c.ssh=SimpleNamespace(run=lambda *args,**kwargs:calls.append((args,kwargs)) or (0,'{}',''))
    result=c.member_run({'host':'node','user':'operator','sudo':True},'curl --key /etc/meshagent/tls/client.key -d @-',stdin='{}')
    assert result[0]==0
    args,kwargs=calls[0]
    assert args[:2]==('node','operator') and args[2].startswith('sudo -n bash -c ')
    assert kwargs['stdin']=='{}'


def test_offline_removed_server_remains_pending_until_cleanup_succeeds(tmp_path,monkeypatch):
    import meshctl.provision
    class Offline(Node):
        def put(self,*args):raise OSError('server offline')
    monkeypatch.setattr(meshctl.provision,'Node',Offline)
    c=Control(tmp_path);c.current=voters(4);c.control={}
    c.change_etcd('n4',False,{})
    assert len(c.current)==3 and c.remove_calls==1
    assert c.control['operation']['stage']=='cleanup' and c.control['operation']['cleanup_pending']
    c.mesh['nodes']['n3']={'overlay':'10.0.0.3'}
    with pytest.raises(ValueError,match='pending'):
        c.start_etcd_change('n3',True)
    monkeypatch.setattr(meshctl.provision,'Node',Node)
    c.change_etcd('n4',False,{})
    assert c.remove_calls==1 and c.control['operation']['stage']=='done'
    assert not c.control['operation']['cleanup_pending']


def test_onboarding_cannot_overwrite_another_pending_membership_change(tmp_path):
    c=Control(tmp_path)
    c.control={'operation':{'name':'n3','kind':'remove','stage':'cleanup','cleanup_pending':True}}
    with pytest.raises(ValueError,match='pending'):
        c.change_etcd('n4',True,{})
    assert c.control['operation']['name']=='n3' and c.add_calls==0

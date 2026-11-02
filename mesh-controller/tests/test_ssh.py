from types import SimpleNamespace
import pytest
import meshctl.app as app


class Channel:
    def __init__(self): self.closed=False;self.output=b'ok';self.error=b'warning'
    def shutdown_write(self): pass
    def recv_ready(self): return bool(self.output)
    def recv_stderr_ready(self): return bool(self.error)
    def recv(self,n): result=self.output;self.output=b'';return result
    def recv_stderr(self,n): result=self.error;self.error=b'';return result
    def exit_status_ready(self): return True
    def recv_exit_status(self): return 0
    def close(self): self.closed=True


class Client:
    created=[];connect_failures=0;command_failure=False
    def __init__(self): self.closed=False;self.executions=0;self.created.append(self)
    def load_host_keys(self,p): self.known_hosts=p
    def set_missing_host_key_policy(self,p): self.policy=p
    def connect(self,*args,**kwargs):
        self.options=kwargs
        if Client.connect_failures:
            Client.connect_failures-=1
            raise OSError('connection unavailable')
    def get_transport(self): return SimpleNamespace(is_active=lambda:not self.closed,set_keepalive=lambda n:None,open_channel=lambda *args,**kwargs:object())
    def close(self): self.closed=True
    def exec_command(self,cmd,**kwargs):
        self.executions+=1
        if Client.command_failure: raise OSError('connection lost after dispatch')
        channel=Channel()
        return SimpleNamespace(write=lambda data:None,channel=channel),SimpleNamespace(channel=channel),SimpleNamespace(channel=channel)


def setup(monkeypatch):
    Client.created=[];Client.connect_failures=0;Client.command_failure=False
    monkeypatch.setattr(app.paramiko,'SSHClient',Client)
    monkeypatch.setattr(app.paramiko.Ed25519Key,'from_private_key_file',lambda p:None)
    monkeypatch.setattr(app.time,'sleep',lambda n:None)
    return app.Ssh('/unused')


def test_reuses_transport_and_drains_both_streams(monkeypatch):
    ssh=setup(monkeypatch)
    assert ssh.run('host','root','cmd',stdin='payload')==(0,'ok','warning')
    assert ssh.run('host','root','cmd')==(0,'ok','warning')
    assert len(Client.created)==1 and Client.created[0].executions==2


def test_retries_connection_before_dispatch_but_never_replays_uncertain_command(monkeypatch):
    ssh=setup(monkeypatch);Client.connect_failures=1
    assert ssh.run('host','root','cmd')[0]==0
    assert len(Client.created)==2 and sum(c.executions for c in Client.created)==1
    Client.command_failure=True
    with pytest.raises(OSError): ssh.run('host','root','mutating-command')
    assert sum(c.executions for c in Client.created)==2
    assert ('host','root') not in ssh.pool


def test_explicit_jump_authenticates_target_with_same_identity(monkeypatch):
    ssh=setup(monkeypatch)
    ssh.jumps={'target':{'host':'gateway','user':'root','target':'10.88.0.2'}}
    assert ssh.run('target','root','install')[0]==0
    assert len(Client.created)==2
    target=ssh.pool[('target','root')]
    assert 'sock' in target.options
    assert target.options['pkey'] is ssh.key
    assert ssh.pool[('gateway','root')].executions==1 and target.executions==1


def test_verifies_known_host_keys(monkeypatch):
    ssh=setup(monkeypatch)
    ssh.run('host','root','true')
    assert Client.created[0].known_hosts == '/secrets/known_hosts'
    assert isinstance(Client.created[0].policy, app.paramiko.RejectPolicy)

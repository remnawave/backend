#!/usr/bin/env python3
"""Boot a disposable upstream DB/API/sidecar, exercising actual authentication."""
import json
import secrets
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from test_lab import BASE, HERE, compose, execute

PANEL_BASE=BASE+['-f',str(HERE/'compose.panel.yaml')]
def panel(*args):
    run=subprocess.run(PANEL_BASE+list(args),capture_output=True,text=True)
    if run.returncode:raise RuntimeError(run.stderr[-1500:])
    return run.stdout

def api(path,body=None,token=None):
    headers={'Content-Type':'application/json','X-Forwarded-For':'127.0.0.1','X-Forwarded-Proto':'https','X-Remnawave-Client-Type':'browser'}
    if token:headers['Authorization']='Bearer '+token
    # The lab network is internal. Requests run inside its API container; no host ports.
    script = """const fs=require('node:fs'); const r=JSON.parse(fs.readFileSync(0,'utf8'));
    fetch('http://127.0.0.1:3000/api/'+r.path,{headers:r.headers,
      method:r.body===null?'GET':'POST',body:r.body===null?undefined:JSON.stringify(r.body),
      signal:AbortSignal.timeout(4000)}).then(async response=>{
        console.log(JSON.stringify([response.status,await response.json()]));
      }).catch(()=>process.exit(2));"""
    run=subprocess.run(PANEL_BASE+['exec','-T','panel','node','-e',script],
        input=json.dumps({'path':path,'body':body,'headers':headers}),capture_output=True,text=True)
    if run.returncode:raise OSError('Local API is not ready')
    return json.loads(run.stdout)

def main():
    state=HERE/'state';state.mkdir(exist_ok=True)
    token=secrets.token_urlsafe(36);password=secrets.token_urlsafe(32);dbpassword=secrets.token_urlsafe(24)
    env={'APP_PORT':'3000','METRICS_PORT':'3001','DATABASE_URL':f'postgresql://mesh_lab:{dbpassword}@db:5432/mesh_lab',
        'POSTGRES_USER':'mesh_lab','POSTGRES_PASSWORD':dbpassword,'POSTGRES_DB':'mesh_lab',
        'APP_SECRET':secrets.token_urlsafe(48),'JWT_AUTH_LIFETIME':'12','REDIS_HOST':'redis','REDIS_PORT':'6379',
        'FRONT_END_DOMAIN':'*','SUB_PUBLIC_DOMAIN':'localhost:33080/api/sub','METRICS_USER':'lab','METRICS_PASS':secrets.token_urlsafe(24),
        'MESH_CONTROLLER_URL':'http://controller:8080','MESH_CONTROLLER_TOKEN':token,'MESH_API_TOKEN':token,
        'IS_HTTP_LOGGING_ENABLED':'false','REMNAWAVE_BRANCH':'dev'}
    envfile=state/'panel.env';envfile.write_text(''.join(k+'='+v+'\n' for k,v in env.items()));envfile.chmod(0o600)
    # Lab-only generated key, never a real server credential.
    execute('entry',"python -c \"from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey;from cryptography.hazmat.primitives import serialization;from pathlib import Path;import os; p=Path('/state/controller-key');p.write_bytes(Ed25519PrivateKey.generate().private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.OpenSSH,serialization.NoEncryption()));p.chmod(0o600);os.chown(p,10001,10001);Path('/state/controller').mkdir(exist_ok=True);os.chown('/state/controller',10001,10001)\"")
    (state/'known_hosts').write_text('')
    (state/'controller-config.yaml').write_text('entries: {}\nexits: {}\nprobe_ports: [8443]\nsni: mesh-lab\ninterval: 5\nauto_balancer: false\nauto_switch: false\nauto_relay: false\nauto_ip_update: false\n')
    # Recreate only disposable lab DB state for repeatable registration.
    panel('rm','-sf','panel','db','redis','controller')
    panel('up','-d','--build','db','redis','controller','panel')
    deadline=time.monotonic()+150
    while time.monotonic()<deadline:
        try:
            if api('auth/status')[0]==200:break
        except (OSError,ValueError):pass
        time.sleep(2)
    else:raise AssertionError('Panel did not become ready')
    assert api('mesh/status')[0]==401
    print('PASS: unauthenticated mesh API denied',flush=True)
    status,registered=api('auth/register',{'username':'mesh-lab-admin','password':'Aa1'+password})
    assert status in (200,201), status
    jwt=registered['response']['accessToken']
    status,data=api('mesh/status',token=jwt)
    assert status==200 and data['response']['cycles']>=1,(status,data)
    assert token not in json.dumps(data)
    print('PASS: real administrator auth and sidecar status',flush=True)
    assert api('mesh/probe',{},jwt)[0] in (200,201)
    assert api('mesh/flags',{'auto_relay':'false'},jwt)[0]==400
    assert api('mesh/flags',{'auto_balancer':True},jwt)[0]==400
    assert api('mesh/jobs/not-a-job',token=jwt)[0]==400
    print('PASS: actual API validates flags and job IDs',flush=True)
    panel('stop','controller')
    assert api('mesh/status',token=jwt)[0]==502
    assert api('auth/status')[0]==200
    print('PASS: controller failure isolated from panel',flush=True)
    panel('start','controller')
    # Test opt-out by recreating only this local API container with the URL unset.
    env['MESH_CONTROLLER_URL']='';env.pop('MESH_CONTROLLER_TOKEN')
    envfile.write_text(''.join(k+'='+v+'\n' for k,v in env.items()))
    # Optional URL should be omitted rather than an empty string.
    env.pop('MESH_CONTROLLER_URL');envfile.write_text(''.join(k+'='+v+'\n' for k,v in env.items()))
    panel('up','-d','--no-deps','--force-recreate','panel')
    deadline=time.monotonic()+90
    while time.monotonic()<deadline:
        try:
            if api('auth/status')[0]==200:break
        except (OSError,ValueError):pass
        time.sleep(2)
    assert api('mesh/status',token=jwt)[0]==503
    assert api('auth/status')[0]==200
    print('PASS: disabled mesh preserves normal panel API',flush=True)
    print('Local upstream API integration completed',flush=True)

if __name__=='__main__':main()

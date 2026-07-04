import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'scripts', 'ai-harness-report.json');

const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));
function request({hostname='127.0.0.1',port=5055,method='GET',path:reqPath='/',body=null,headers={}}){
  return new Promise((resolve, reject)=>{
    const data = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const opts={hostname,port:Number(port),path:reqPath,method,headers:{
      'Content-Type':'application/json',...(headers||{})
    }};
    const req=http.request(opts, res=>{
      const chunks=[];
      res.on('data',c=>chunks.push(c));
      res.on('end',()=>{
        const text=Buffer.concat(chunks).toString('utf-8');
        let parsed; try{parsed=JSON.parse(text);}catch{parsed=text;}
        resolve({status:res.statusCode,data:parsed,raw:text});
      });
    });
    req.on('error',reject);
    if(data) req.write(data);
    req.end();
  });
}
function fail(msg){console.error('[HARNESS][FAIL]',msg);process.exitCode=1;}
function ok(msg){console.log('[HARNESS][PASS]',msg);}

const FALLBACK_PROJECT_IDS = ['demo_proj_1','demo','demo_proj'];

async function resolveProjectId(){
  for(const id of FALLBACK_PROJECT_IDS){
    try{
      const r=await request({path:`/api/projects/${encodeURIComponent(id)}`});
      if(r.status===200 && r.data && r.data.id) return String(r.data.id);
    }catch{}
  }
  return 'demo';
}

async function run(){
  console.log('[HARNESS] Evaluating AI harness endpoints...');
  const projectId = await resolveProjectId();
  ok(`Resolved projectId=${projectId}`);

  let status;
  try{
    const s=await request({path:'/api/ai/harness/status'});
    if(s.status!==200) fail('status endpoint failed: '+s.status+' '+JSON.stringify(s.data).slice(0,200));
    else{ ok(`status endpoint OK => ${JSON.stringify(s.data).slice(0,180)}`); status=s.data; }
  }catch(e){ fail('status endpoint error: '+e.message); }

  let tools;
  try{
    const t=await request({path:'/api/ai/harness/tools'});
    if(t.status!==200) fail('tools endpoint failed: '+t.status);
    else{ const keys=Object.keys(t.data||{}); ok(`tools endpoint OK => ${keys.length} tools`); tools=t.data; }
  }catch(e){ fail('tools endpoint error: '+e.message); }

  const slug = (tools && Object.keys(tools)[0]) ? Object.keys(tools)[0] : null;
  if(!slug) fail('no tools available from /api/ai/harness/tools');

  const probes = [
    {method:'POST',path:'/api/providers/resolve',body:{taskType:'critic_text',organizationId:null,provider:null,providerMode:'platform',fallbackOrder:[]}},
    {method:'POST',path:'/api/providers/routing-log',body:{organizationId:null,projectId:null,jobId:'harness_test',taskType:'critic_text',provider:'mock',providerMode:'platform',capabilityMatch:['text'],fallback_used:0,error_json:null}},
    {method:'GET',path:'/api/providers/tasks'},
    {method:'GET',path:'/api/settings/providers'},
    {method:'GET',path:'/api/health'}
  ];
  for(const p of probes){
    try{
      const r=await request(p);
      if(r.status<200||r.status>=300) fail(p.path+' failed with status '+r.status);
      else ok(`${p.method} ${p.path} OK`);
    }catch(e){ fail(p.path+' error '+e.message); }
  }

  try{
    const r=await request({method:'POST',path:'/api/tools/execute',body:{toolSlug:slug,projectId,params:{room:'living'}},headers:{'Content-Type':'application/json'}});
    if(r.status<200||r.status>=300) fail('/api/tools/execute failed with status '+r.status+' '+JSON.stringify(r.data).slice(0,200));
    else ok(`/api/tools/execute OK for ${slug} => ${JSON.stringify(r.data).slice(0,180)}`);
  }catch(e){ fail('/api/tools/execute failed to run: '+e.message); }

  try{
    const r=await request({method:'GET',path:'/api/projects/:id/jobs'.replace(':id',encodeURIComponent(projectId))});
    if(r.status<200||r.status>=300) fail('/api/jobs failed with status '+r.status);
    else ok(`/api/jobs OK => ${JSON.stringify(r.data).slice(0,180)}`);
  }catch(e){ fail('/api/projects/:id/jobs failed: '+e.message); }

  try {
    const r = await request({ method: 'GET', path: '/api/settings/providers' });
    if (r.status !== 200 || !r.data || !r.data.success) fail('/api/settings/providers contract changed');
    ok('/api/settings/providers schema OK');
  } catch (e) { fail('/api/settings/providers failed: ' + e.message); }

}
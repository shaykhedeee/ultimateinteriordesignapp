import http from 'node:http';
const BASE='http://127.0.0.1:5055';
function req(m,p,b){return new Promise((res,rej)=>{const d=b?JSON.stringify(b):null;const r=http.request(BASE+p,{method:m,headers:d?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}:{}},x=>{let c=[];x.on('data',y=>c.push(y));x.on('end',()=>{let j;try{j=JSON.parse(Buffer.concat(c).toString())}catch{j=null}res({s:x.statusCode,j,buf:Buffer.concat(c)})});});r.on('error',rej);if(d)r.write(d);r.end();});}
let pass=0,fail=0;const fails=[];
function check(name,ok,extra=''){if(ok)pass++;else{fail++;fails.push(name+' '+extra);}console.log((ok?'OK  ':'FAIL')+' '+name+'  '+extra);}
(async()=>{
 // project + plan
 const cp=await req('POST','/api/projects',{name:'Hardening',client_name:'X',email:'a@b.com',phone:'9',budget:1000000});const pid=cp.j.id;
 check('create project',cp.s===201,cp.s);
 const plan=await req('POST',`/api/projects/${pid}/plan`,{walls:[{id:'W1',x1:0,y1:0,x2:5000,y2:0},{id:'W2',x1:5000,y1:0,x2:5000,y2:3500},{id:'W3',x1:5000,y1:3500,x2:0,y2:3500},{id:'W4',x1:0,y1:3500,x2:0,y2:0}],rooms:[{name:'Hall',x:0,y:0,w:5000,h:3500}]});
 check('floor plan',plan.s===200&&plan.j.success,plan.s);
 // every major GET route must not 500
 const gets=[
  ['/api/projects',null],
  [`/api/projects/${pid}`,null],
  [`/api/projects/${pid}/readiness`,null],
  [`/api/projects/${pid}/brief`,null],
  [`/api/projects/${pid}/materials`,null],
  [`/api/projects/${pid}/quotation`,null],
  [`/api/projects/${pid}/renders`,null],
  [`/api/projects/${pid}/vastu/analyze`,null],
  [`/api/projects/${pid}/plan/detect-furniture`,null],
  [`/api/projects/${pid}/drawings/floorplan/dxf`,null],
  [`/api/projects/${pid}/drawings/elevations/auto/dxf`,null],
  [`/api/projects/${pid}/brief/pdf`,null],
  ['/api/material-catalog',null],
  ['/api/catalogue/brochures',null],
  ['/api/design-library',null],
  ['/api/render/providers',null],
  ['/api/settings/api-keys',null],
  ['/api/pipeline/templates',null],
 ];
 for(const [p] of gets){const r=await req('GET',p);check('GET '+p,r.s<500&&r.s!==404?true:r.s===404,r.s);}
 // key POST (BYOK)
 const k=await req('POST','/api/keys',{provider:'gemini',key:'AIzaTestKey1234567890abcdef'});check('BYOK key save',k.s===200,k.s);
 // quotation save + pdf
 const q=await req('POST',`/api/projects/${pid}/quotation`,{quotation:{items:[{room:'Kitchen',name:'Carcass',rate:250000,sqft:1,amount:250000}],grandTotal:295000}});check('quotation save',q.s===200,q.s);
 const qp=await req('POST',`/api/projects/${pid}/quotation/pdf`,{});check('quotation pdf',qp.s===200&&qp.buf.subarray(0,5).toString()==='%PDF-',qp.s);
 const bp=await req('GET',`/api/projects/${pid}/brief/pdf`);check('brief pdf',bp.s===200&&bp.buf.subarray(0,5).toString()==='%PDF-',bp.s);
 // delivery + pipeline
 const dp=await req('POST',`/api/projects/${pid}/delivery-package`,{});check('delivery-package',dp.s<500,dp.s);
 const pr=await req('POST',`/api/projects/${pid}/pipeline/run`,{});check('pipeline/run',pr.s<500,pr.s);
 console.log(`\n${pass} OK, ${fail} FAIL`);
 if(fail)console.log('FAILURES:\n'+fails.join('\n'));
 process.exit(fail?1:0);
})().catch(e=>{console.error('ERR',e);process.exit(2);});

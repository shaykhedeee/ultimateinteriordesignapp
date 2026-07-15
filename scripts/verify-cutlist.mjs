import http from 'http';
import { writeFileSync } from 'fs';
function get(pathname){return new Promise((res,rej)=>{http.get('http://127.0.0.1:8787'+pathname,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res({code:r.statusCode,body:d}))}).on('error',rej)})}
const j = await get('/api/projects');
const arr = JSON.parse(j.body);
const pid = (arr.find(x=>x.id)||arr[0]||{}).id;
console.log('PID='+pid);
const rf = await new Promise((res,rej)=>{const req=http.request('http://127.0.0.1:8787/api/projects/'+pid+'/cutlist/refresh',{method:'POST'},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res({code:r.statusCode,body:d}))});req.end();});
console.log('refresh http='+rf.code, rf.body.slice(0,160));
const cl = await get('/api/projects/'+pid+'/cutlist');
writeFileSync('/tmp/cl.json', cl.body);
try{
  const obj = JSON.parse(cl.body);
  const p = obj.payload?JSON.parse(obj.payload):obj;
  const sl = p.sheetLayout;
  if(!sl){console.log('no sheetLayout; keys=',Object.keys(obj));process.exit(0);}
  console.log('sheets:',sl.sheets.length);
  console.log('unplaced:',(sl.unplaced||[]).length);
  console.log('globalWastePercent:',sl.globalWastePercent);
  console.log('nestOptimizer pieces:',sl.sheets.reduce((a,s)=>a+s.pieces.filter(x=>x.fromNestOptimizer).length,0));
  console.log('offcut reused:',sl.offcutReuse.reusedCount);
}catch(e){console.log('parse err',e.message, cl.body.slice(0,160));}

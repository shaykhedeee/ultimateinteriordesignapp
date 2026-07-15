import http from 'node:http';
function req(m,p,b){return new Promise((res,rej)=>{const d=b?JSON.stringify(b):null;const r=http.request('http://127.0.0.1:8787'+p,{method:m,headers:d?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}:{}},x=>{let c=[];x.on('data',y=>c.push(y));x.on('end',()=>res({s:x.statusCode,body:Buffer.concat(c).toString()}));});r.on('error',rej);if(d)r.write(d);r.end();});}
const ev=await req('POST','/api/projects/dxftest1/elevations/from-renders',{units:['wardrobe','kitchen']});
console.log('status',ev.s);
console.log('body',ev.body.slice(0,300));

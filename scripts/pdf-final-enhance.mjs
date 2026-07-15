import http from 'node:http';
import fs from 'fs';
import zlib from 'zlib';
const BASE='http://127.0.0.1:5056';
function req(m,p,b){return new Promise((res,rej)=>{const d=b?JSON.stringify(b):null;const r=http.request(BASE+p,{method:m,headers:d?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}:{}},x=>{let c=[];x.on('data',y=>c.push(y));x.on('end',()=>{let j;try{j=JSON.parse(Buffer.concat(c).toString())}catch{j=null}res({s:x.statusCode,j,buf:Buffer.concat(c)})});});r.on('error',rej);if(d)r.write(d);r.end();});}
function decodePdf(buf){const s=buf.toString('latin1');let t='';const re=/stream\r?\n?([\s\S]*?)\r?\n?endstream/g;let m;while((m=re.exec(s))){try{t+=zlib.inflateSync(Buffer.from(m[1],'latin1')).toString('latin1')}catch(e){}}return (t.match(/<([0-9A-Fa-f]+)>/g)||[]).map(h=>{const x=h.slice(1,-1);let o='';for(let i=0;i<x.length;i+=2)o+=String.fromCharCode(parseInt(x.substr(i,2),16));return o;}).join('').replace(/\s+/g,' ');}
(async()=>{
 const cp=await req('POST','/api/projects',{name:'FinalEnh',client_name:'Enh'});const pid=cp.j.id;
 await req('POST',`/api/projects/${pid}/plan`,{walls:[{id:'W1',x1:0,y1:0,x2:5000,y2:0},{id:'W2',x1:5000,y1:0,x2:5000,y2:3500},{id:'W3',x1:5000,y1:3500,x2:0,y2:3500},{id:'W4',x1:0,y1:3500,x2:0,y2:0}],rooms:[{name:'Hall',x:0,y:0,w:5000,h:3500}]});
 // quotation with items
 const q={items:[{room:'Kitchen',name:'Carcass',rate:250000,sqft:1,amount:250000},{room:'Wardrobe',name:'Sliding',rate:120000,sqft:1,amount:120000}],subTotal:370000,gstValue:66600,grandTotal:436600};
 await req('POST',`/api/projects/${pid}/quotation`,{quotation:q});
 // GET quotation PDF (mirror) should now show items
 const qpdf=await req('GET',`/api/projects/${pid}/quotation/pdf`);
 fs.writeFileSync('/tmp/q.pdf',qpdf.buf);
 const qd=decodePdf(qpdf.buf);
 console.log('QUOTATION PDF:',qpdf.s,'bytes',qpdf.buf.length,'has Kitchen:',qd.includes('Kitchen'),'has Wardrobe:',qd.includes('Wardrobe'),'has 436600:',qd.includes('436600'));
 // brief PDF Vastu depth
 const bpdf=await req('GET',`/api/projects/${pid}/brief/pdf`);
 fs.writeFileSync('/tmp/b.pdf',bpdf.buf);
 const bd=decodePdf(bpdf.buf);
 console.log('BRIEF PDF:',bpdf.s,'bytes',bpdf.buf.length,'has Vastu:',bd.includes('Vastu'),'has Hall:',bd.includes('Hall'),'has Recommended:',bd.includes('Recommended'));
 console.log('vastu subsection sample:',bd.slice(bd.indexOf('Vastu')-10,bd.indexOf('Vastu')+120));
})().catch(e=>{console.error(e);process.exit(2);});

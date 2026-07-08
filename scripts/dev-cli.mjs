import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DELIVERABLE_DIR = path.join(projectRoot, '_deliverables', 'nambia-pipeline');
const PROJECT_ID = 'proj-nambia-25bhk';

// Analyzed mm-accurate layout from screenshots
const ROOMS = [
  { name: "Children's Bedroom", type: 'bedroom', x: 0, y: 0, w: 2900, h: 3350 },
  { name: 'Toilet Top', type: 'toilet', x: 2900, y: 0, w: 1116, h: 2133 },
  { name: 'Home Office', type: 'office', x: 4016, y: 0, w: 2643, h: 2096 },
  { name: 'Balcony', type: 'balcony', x: 0, y: 3350, w: 600, h: 187 },
  { name: 'Living Dining', type: 'living', x: 600, y: 3350, w: 2549, h: 2842 },
  { name: 'Master Bedroom', type: 'bedroom', x: 0, y: 3537, w: 3005, h: 3350 },
  { name: 'Toilet Bottom', type: 'toilet', x: 3005, y: 3537, w: 2246, h: 1081 },
  { name: 'Kitchen', type: 'kitchen', x: 3005, y: 4618, w: 2692, h: 2022 },
];

// Wall tree: rough internal lines separating rooms, not just perimeter
const WALLS = [
  { id: 'w_north', x1: 0, y1: 0, x2: 6659, y2: 0 },
  { id: 'w_east', x1: 6659, y1: 0, x2: 6659, y2: 7000 },
  { id: 'w_south', x1: 6659, y1: 7000, x2: 0, y2: 7000 },
  { id: 'w_west', x1: 0, y1: 7000, x2: 0, y2: 0 },
  { id: 'w1', x1: 2900, y1: 0, x2: 2900, y2: 2133 },
  { id: 'w2', x1: 2900, y1: 2133, x2: 0, y2: 2133 },
  { id: 'w3', x1: 0, y1: 3350, x2: 600, y2: 3350 },
  { id: 'w4', x1: 600, y1: 3350, x2: 600, y2: 7000 },
  { id: 'w5', x1: 600, y1: 6192, x2: 6659, y2: 6192 },
  { id: 'w6', x1: 3005, y1: 3537, x2: 3005, y2: 4618 },
  { id: 'w7', x1: 3005, y1: 4618, x2: 3005, y2: 6640 },
  { id: 'w8', x1: 4016, y1: 2096, x2: 6659, y2: 2096 },
];

const OPENINGS = [
  { wallId: 'w_north', type: 'door', x: 1400, w: 900 },
  { wallId: 'w_north', type: 'window', x: 3200, w: 1800 },
  { wallId: 'w1', type: 'door', x: 400, w: 900 },
  { wallId: 'w2', type: 'window', x: 1600, w: 1200 },
  { wallId: 'w3', type: 'door', x: 280, w: 900 },
];

const FURNITURE = [
  { room: "Children's Bedroom", type: 'bed', x: 200, y: 200, w: 2000, h: 1800 },
  { room: "Children's Bedroom", type: 'wardrobe', x: 50, y: 2000, w: 800, h: 600 },
  { room: "Living Dining", type: 'sofa', x: 800, y: 2200, w: 1800, h: 900 },
  { room: "Living Dining", type: 'dining', x: 900, y: 800, w: 1500, h: 800 },
  { room: 'Master Bedroom', type: 'bed', x: 200, y: 600, w: 2000, h: 1800 },
  { room: 'Master Bedroom', type: 'wardrobe', x: 50, y: 2600, w: 900, h: 600 },
  { room: 'Kitchen', type: 'counter', x: 200, y: 400, w: 2200, h: 700 },
  { room: 'Kitchen', type: 'island', x: 1400, y: 1300, w: 900, h: 600 },
];

function polyArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i][0] * pts[j][1];
    a -= pts[j][0] * pts[i][1];
  }
  return Math.abs(a / 2) / 1e6;
}

async function loadWriters() {
  let dxf = null;
  let pdf = null;
  try {
    const m = await import(pathToFileURL(path.join(projectRoot, 'server', 'services', 'dxf-writer.js')).href);
    dxf = m;
  } catch (e) {
    console.warn('dxf-writer import failed:', e.message);
  }
  try {
    const m = await import(pathToFileURL(path.join(projectRoot, 'server', 'services', 'pdf-elevation.js')).href);
    pdf = m;
  } catch (e) {
    console.warn('pdf-elevation import failed:', e.message);
  }
  return { dxf, pdf };
}

class AccurateFloorWriter {
  constructor() { this.ents = []; this.header = []; }
  _add(...parts) { for (let i = 0; i < parts.length; i += 2) this.ents.push(String(parts[i]).padStart(3, ' '), typeof parts[i+1] === 'number' ? parts[i+1].toFixed(3) : String(parts[i+1])); }
  line(x1,y1,x2,y2,layer='0',color=1){ this._add('0','LINE','8',layer,'62',color,'10',x1,'20',y1,'30',0,'11',x2,'21',y2,'31',0); }
  lwpoly(pts,layer='0',closed=true,color=1){ this._add('0','LWPOLYLINE','8',layer,'62',color,'90',pts.length,'70',closed?1:0); for (const [x,y] of pts) this._add('10',x,'20',y); }
  text(x,y,str,h=180,layer='ANNOTATIONS',color=1,align='MIDDLE'){ this._add('0','TEXT','8',layer,'62',color,'10',x,'20',y,'30',0,'40',h,'1',String(str).toUpperCase(),'72',align==='MIDDLE'?1:5,'11',x,'21',y); }
  dimH(x1,x2,y,yBase,label,layer='DIMENSIONS',color=1){ const ext=250; this.line(x1,y,x1,y-ext,layer,color); this.line(x2,y,x2,y-ext,layer,color); this.line(x1,y,x2,y,layer,color); this._tick(x1,y,0,layer,color); this._tick(x2,y,0,layer,color); this.text((x1+x2)/2,y+200,label,170,layer,color); }
  dimV(x,y1,y2,xLine,label,layer='DIMENSIONS',color=1){ const ext=250; this.line(x,y1,x-ext,y1,layer,color); this.line(x,y2,x-ext,y2,layer,color); this.line(x,y1,x,y2,layer,color); this._tick(x,y1,Math.PI/2,layer,color); this._tick(x,y2,Math.PI/2,layer,color); this.text(x-350,(y1+y2)/2,label,170,layer,color,'MIDDLE'); }
  _tick(x,y,ang,layer='DIMENSIONS',color=1){ const t=ang+Math.PI/2,s=110; this.line(x-s*Math.cos(t),y-s*Math.sin(t),x+s*Math.cos(t),y+s*Math.sin(t),layer,color); }
  hatchRect(x,y,w,h,layer='HATCH',color=8,pattern='ANSI31',scale=50){ this._add('0','HATCH','8',layer,'62',color,'2',pattern,'70',1,'71',1,'91',4,'92',1,'72',3,'73',1,'93',4,'75',0,'76',1,'77',0,'78',1,'53',0,'43',scale,'44',0,'45',0,'46',0,'79',0,'47',0,'98',1,'10',x,'20',y); }
  buildHeader(layers){ const out=[]; out.push('0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC','0','SECTION','2','TABLES','0','TABLE','2','LAYER','70',String(layers.length)); for (const [name,color,ltype] of layers) out.push('0','LAYER','2',name,'70','0','62',String(color),'6',ltype); out.push('0','ENDTAB','0','ENDSEC','0','SECTION','2','ENTITIES'); out.push(...this.ents); out.push('0','ENDSEC','0','EOF'); return out.join('\n'); }
}

function writeFloorPlan() {
  const w = new AccurateFloorWriter();
  const layers = [
    ['0',7,'CONTINUOUS'],['WALL',1,'CONTINUOUS'],['OPENING',1,'CONTINUOUS'],['FURNITURE',7,'CONTINUOUS'],['DIMENSION',1,'CONTINUOUS'],['ROOM_LABEL',1,'CONTINUOUS'],['HATCH',8,'CONTINUOUS'],['TITLEBLOCK',4,'CONTINUOUS']
  ];

  // Room polygons with snapping
  for (const r of ROOMS) {
    const pts = [[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]];
    w.lwpoly(pts,'ROOM_LABEL',true,7);
    w.text(r.x+r.w/2,r.y+r.h/2,r.name,220,'ROOM_LABEL',1);
    w.text(r.x+r.w/2,r.y+r.h/2+280,`${(r.w/1000).toFixed(2)}m x ${(r.h/1000).toFixed(2)}m`,140,'ROOM_LABEL',1);
    w.hatchRect(r.x+80,r.y+80,r.w-160,r.h-160,'HATCH',8,'ANSI31',60);
  }

  // Walls
  for (const wall of WALLS) {
    w.line(wall.x1,wall.y1,wall.x2,wall.y2,'WALL',1);
    const dx=wall.x2-wall.x1,dy=wall.y2-wall.y1;
    const len=Math.hypot(dx,dy);
    if(len>800) w.dimH(wall.x1,wall.x2,wall.y1,wall.y1-200,`${Math.round(len)}mm`,'DIMENSION',1);
  }

  // Openings on perimeter walls only in plan
  for (const op of OPENINGS) {
    const wall = WALLS.find(ww=>ww.id===op.wallId); if(!wall) continue;
    const dx=wall.x2-wall.x1, dy=wall.y2-wall.y1;
    const len=Math.hypot(dx,dy); if(len<10) continue;
    const ux=dx/len, uy=dy/len;
    const ox=wall.x1+ux*op.x, oy=wall.y1+uy*op.x;
    const nx=-uy, ny=ux;
    const depth=op.type==='door'?900:180;
    w.line(ox,oy,ox+nx*depth,oy+ny*depth,'OPENING',1);
    w.text(ox+nx*(depth+200),oy+ny*(depth+200),op.type==='door'?'DOOR':'WINDOW',180,'OPENING',1);
  }

  // Furniture blocks
  for (const f of FURNITURE) {
    const r = ROOMS.find(rr=> rr.name===f.room); if(!r) continue;
    const fx=r.x+f.x, fy=r.y+f.y;
    w.line(fx,fy,fx+f.w,fy,'FURNITURE',1);
    w.line(fx+f.w,fy,fx+f.w,fy+f.h,'FURNITURE',1);
    w.line(fx+f.w,fy+f.h,fx,fy+f.h,'FURNITURE',1);
    w.line(fx,fy+f.h,fx,fy,'FURNITURE',1);
    w.text(fx+f.w/2,fy+f.h/2,f.type.replace('_',' '),160,'FURNITURE',1);
  }

  // Perimeter dimensions
  w.dimH(0,ROOMS.reduce((m,r)=>Math.max(m,r.x+r.w),0), -500, -800, `${Math.round(ROOMS.reduce((m,r)=>Math.max(m,r.x+r.w),0)/1000*304.8)}' (${Math.round(ROOMS.reduce((m,r)=>Math.max(m,r.x+r.w),0))}mm)`, 'DIMENSION',1);
  w.dimV(7000,0,ROOMS.reduce((m,r)=>Math.max(m,r.y+r.h),0),7000, `${Math.round(ROOMS.reduce((m,r)=>Math.max(m,r.y+r.h),0)/1000*304.8)}' (${Math.round(ROOMS.reduce((m,r)=>Math.max(m,r.y+r.h),0))}mm)`, 'DIMENSION',1);

  w._add('0','TEXT','8','TITLEBLOCK','62','4','10',1500,'20',-1600,'30',0,'40',250,'1','NAMBIA 2.5BHK FLOOR PLAN — SCALE 1:50','72',5,'11',1500,'21',-1600);

  const out = w.buildHeader(layers);
  fs.writeFileSync(path.join(DELIVERABLE_DIR, 'Nambia_FloorPlan.dxf'), out);
  fs.writeFileSync(path.join(DELIVERABLE_DIR, 'Nambia_FloorPlan_Accurate.dxf'), out);
  console.log('dxf', 'Nambia_FloorPlan.dxf', out.length, 'bytes');
  console.log('dxf', 'Nambia_FloorPlan_Accurate.dxf', out.length, 'bytes');
}

function write3DTopViews() {
  for (const r of ROOMS) {
    const H = 2850;
    const corners = [[0,0],[r.w,0],[r.w,r.h],[0,r.h]];
    const out = [];
    out.push('0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC','0','SECTION','2','TABLES','0','TABLE','2','LAYER','70','5');
    for (const [name,color,ltype] of [['0',7,'CONTINUOUS'],['ROOM',7,'CONTINUOUS'],['FURNITURE',1,'CONTINUOUS'],['WALLS',1,'CONTINUOUS'],['TITLEBLOCK',4,'CONTINUOUS']]) out.push('0','LAYER','2',name,'70','0','62',String(color),'6',ltype);
    out.push('0','ENDTAB','0','ENDSEC','0','SECTION','2','ENTITIES');
    for (let i=0;i<corners.length;i++) {
      const [x1,y1]=corners[i];
      const [x2,y2]=corners[(i+1)%corners.length];
      out.push('0','3DFACE','8','WALLS','62','1');
      out.push('10',x1,'20',y1,'30',0);
      out.push('11',x2,'21',y2,'31',0);
      out.push('12',x1,'22',y1,'32',H);
      out.push('13',x2,'23',y2,'33',H);
      out.push('0','3DFACE','8','WALLS','62','1');
      out.push('10',x1,'20',y1,'30',H);
      out.push('11',x1,'21',y1,'31',0);
      out.push('12',x2,'22',y2,'33',0);
      out.push('13',x2,'23',y2,'32',H);
    }
    const furts=[
      {name:'BED',x:200,y:200,w:Math.min(r.w-400,2000),h:1800,hz:300},
      {name:'WARDROBE',x:60,y:r.h-660,w:820,h:600,hz:600},
    ];
    for (const f of furts) if(f.w>0 && f.h>0) {
      out.push('0','3DFACE','8','FURNITURE','62','3','90','4','70','15');
      out.push('10',f.x,'20',f.y,'30',f.hz);
      out.push('11',f.x+f.w,'21',f.y,'32',f.hz);
      out.push('12',f.x+f.w,'22',f.y+f.h,'33',f.hz+f.hz);
      out.push('13',f.x,'23',f.y+f.h,'31',f.hz+f.hz);
      out.push('0','TEXT','8','FURNITURE','62','1','10',f.x+f.w/2,'20',f.y+f.h/2,'30',f.hz+150,'40',160,'1',f.name,'72',1);
    }
    out.push('0','TEXT','8','TITLEBLOCK','62','4','10',r.w/2,'20',-500,'30',0,'40',180,'1',`3D MODEL ${r.name.toUpperCase()} ${r.w}x${r.h}x${H}mm`,'72',5);
    out.push('0','ENDSEC','0','EOF');
    const safeName = r.name.replace(/[^a-zA-Z0-9]+/g,'_');
    const txt = out.join('\n');
    fs.writeFileSync(path.join(DELIVERABLE_DIR, `${safeName}_3D.dxf`), txt);
    fs.writeFileSync(path.join(DELIVERABLE_DIR, `${safeName}_3D_Accurate.dxf`), txt);
    console.log('dxf', `${safeName}_3D.dxf`, txt.length, 'bytes');
  }
}

async function writeElevations(dxfModule){
  if(!dxfModule?.buildElevationDXF) return;
  const dirs=[
    {dir:'NORTH',x1:0,y1:0,x2:6659,y2:0,openings:[{x:1400,w:900,type:'door',sill:0,head:2100},{x:3200,w:1800,type:'window',sill:900,head:2100}],cabs:[{id:'cab_n1',name:'LIVING CABINET',tag:'OPEN UNIT',widthMm:2400,heightMm:2400,xOffsetMm:1200,zOffsetMm:0,material:{callout:'PU Paint',glass:false,cane:false},handleType:'pull',lighting:'LED STRIP'}]},
    {dir:'SOUTH',x1:0,y1:7000,x2:6659,y2:7000,openings:[{x:1800,w:1200,type:'window',sill:900,head:2100}],cabs:[{id:'cab_s1',name:'DINING CABINET',tag:'DRAWER',widthMm:1800,heightMm:720,xOffsetMm:1800,zOffsetMm:0,material:{callout:'Laminate + DecoTac',glass:false,cane:false},handleType:'bar'}]},
    {dir:'EAST',x1:6659,y1:0,x2:6659,y2:7000,openings:[{x:2100,w:900,type:'door',sill:0,head:2100}],cabs:[{id:'cab_e1',name:'WARDROBE',tag:'SHUTTER + DRAWER BASE',widthMm:1800,heightMm:2400,xOffsetMm:600,zOffsetMm:0,material:{callout:'Fluted Glass on Frame',glass:true,cane:false},handleType:'pull'}]},
    {dir:'WEST',x1:0,y1:0,x2:0,y2:7000,openings:[{x:1600,w:1200,type:'window',sill:900,head:2100}],cabs:[{id:'cab_w1',name:'ENTERTAINMENT',tag:'OPEN UNIT',widthMm:2200,heightMm:600,xOffsetMm:200,zOffsetMm:0,material:{callout:'High Gloss + Groove',glass:false,cane:false},handleType:'handle'}]}
  ];
  for (const d of dirs) {
    const model = { lengthMm: Math.round(Math.hypot(d.x2-d.x1,d.y2-d.y1)), heightMm: 2700, thicknessMm: 200, openings: d.openings.map(o=>({offsetMm:o.x,widthMm:o.w,sillMm:o.sill,headMm:o.head,type:o.type})), cabinets: d.cabs, coverage:{utilPercent:72,usedMm:2100,freeMm:1200} };
    const dxf = dxfModule.buildElevationDXF(model, { componentLayers:{useGlassLayers:true,useCaneLayers:true,useHandleLayers:true,useFrameLayers:true}, scale:'1:25', rev:'1.0', projectId:PROJECT_ID, sheet:`Nambia ${d.dir} Elevation` });
    fs.writeFileSync(path.join(DELIVERABLE_DIR, `Nambia_${d.dir}_Elevation.dxf`), dxf);
    console.log('dxf', `Nambia_${d.dir}_Elevation.dxf`, dxf.length, 'bytes');
  }
}

async function main(){
  fs.mkdirSync(DELIVERABLE_DIR,{recursive:true});
  const {dxf, pdf} = await loadWriters();
  writeFloorPlan();
  write3DTopViews();
  await writeElevations(dxf);
  const files = fs.readdirSync(DELIVERABLE_DIR).filter(f=>fs.statSync(path.join(DELIVERABLE_DIR,f)).isFile());
  const manifest = { generatedAt:new Date().toISOString(), projectId:PROJECT_ID, files: files.map(f=>({file:f,bytes:fs.statSync(path.join(DELIVERABLE_DIR,f)).size})), rooms: ROOMS.map(r=>({name:r.name,x:r.x,y:r.y,w:r.w,h:r.h,areaSqft:Math.round((r.w*r.h)/92903*10)/10, areaSqm:Math.round((r.w*r.h)/1e6*100)/100})) };
  fs.writeFileSync(path.join(DELIVERABLE_DIR,'manifest.json'), JSON.stringify(manifest,null,2));
  console.log('Done', DELIVERABLE_DIR);
}
main().catch(e=>{console.error(e);process.exit(1)});

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const pipeline = await import(pathToFileURL(path.join(projectRoot, 'server/services/pipeline-orchestrator.js')).href);

const KITCHEN = {
  name:'Kitchen',
  shape:'L-shape',
  style:'modern-laminate',
  w:3800,
  h:3200,
  counters:'base+wall+dado',
  appliances:['hob','chimney','oven'],
  utility:'dedicated-utility-washing'
};

let result = null;
try {
  result = await pipeline.runPipeline({
    projectId: 'proj-nambia-25bhk-opt2',
    rooms: [{
      name: KITCHEN.name,
      w: KITCHEN.w,
      h: KITCHEN.h,
      openings:[
        { offsetMm:900, widthMm:2000, sillMm:0, headMm:2100, type:'window' },
        { offsetMm:1800, widthMm:900, sillMm:900, headMm:2100, type:'door' }
      ],
      cabinets:[
        { id:'k1', type:'base', widthMm:2400, heightMm:720, xOffsetMm:0, zOffsetMm:0, name:'Main Base Run', material:{ callout:'Matte Laminate', glass:false, cane:false }, handleType:'pull' },
        { id:'k2', type:'wall', widthMm:2400, heightMm:720, xOffsetMm:0, zOffsetMm:1400, name:'Wall Cabinets', material:{ callout:'Matte Laminate', glass:false, cane:false }, handleType:'handle' },
        { id:'k3', type:'base', widthMm:1400, heightMm:720, xOffsetMm:2400, zOffsetMm:0, name:'Tall Utility Unit', material:{ callout:'Matte Laminate', glass:false, cane:false }, handleType:'pull' }
      ]
    }],
    projectName: 'Nambia - L-Shape Kitchen'
  });
  console.log('OK pipeline_done');
  console.log(JSON.stringify({
    outDir: result.outDir,
    images: Array.isArray(result.images)?result.images.length:0,
    dxfs: Array.isArray(result.dxfs)?result.dxfs.length:0,
    pdfs: Array.isArray(result.pdfs)?result.pdfs.length:0,
    skpFiles: Array.isArray(result.skpFiles)?result.skpFiles.length:0,
    rooms: result.rooms || {}
  }, null, 2));
  fs.writeFileSync(path.join(projectRoot, '_deliverables', 'kitchen-option2-result.json'), JSON.stringify(result, null, 2));
} catch (e) {
  console.error('ERROR', e.message);
  process.exit(1);
}

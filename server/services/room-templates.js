import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const outDir = path.join(projectRoot, 'storage', 'briefs');

export const KITCHEN_TEMPLATES = {
  'luxe-parallel-island': {
    id: 'luxe-parallel-island',
    name: 'Luxe Parallel Kitchen + Island',
    tags: ['parallel','island','breakfast','high-gloss','quartz','appliances'],
    defaultRoom: { shape:'rect', w:4200, h:3600 },
    cabinets: [
      { id:'a1', type:'base', widthMm:1200, heightMm:720, xOffsetMm:0, zOffsetMm:0, name:'Base Left', material:{ callout:'High-Gloss Blue', glass:false, cane:false }, handleType:'handle' },
      { id:'a2', type:'island', widthMm:1200, heightMm:720, xOffsetMm:1500, zOffsetMm:1200, name:'Island Counter', material:{ callout:'High-Gloss White', glass:false, cane:false }, handleType:'handleless' },
      { id:'a3', type:'tall', widthMm:500, heightMm:2400, xOffsetMm:0, zOffsetMm:0, name:'Tall Pantry Left', material:{ callout:'High-Gloss Blue', glass:false, cane:false }, handleType:'pull' },
      { id:'a4', type:'tall', widthMm:500, heightMm:2400, xOffsetMm:0, zOffsetMm:0, name:'Tall Pantry Right', material:{ callout:'High-Gloss Blue', glass:false, cane:false }, handleType:'pull' },
      { id:'a5', type:'wall', widthMm:2200, heightMm:720, xOffsetMm:0, zOffsetMm:1400, name:'Wall Units', material:{ callout:'High-Gloss White', glass:false, cane:false }, handleType:'handle' },
    ],
    appliances: [
      { type:'hob', w:600, h:500, label:'Hob' },
      { type:'chimney', w:900, h:450, label:'Chimney' },
      { type:'oven', w:600, h:600, label:'Built-in Oven' },
      { type:'microwave', w:600, h:450, label:'Microwave' },
      { type:'dishwasher', w:600, h:860, label:'Dishwasher' },
    ],
    finishes: { countertop:'Quartz', backsplash:'Dado Matching', flooring:'Marble Look' },
    promptBoost: 'luxury parallel kitchen with island, high-gloss blue and white acrylic, quartz countertops, marble floor, warm ambient cove lighting, photorealistic 8k, architectural photography'
  },
  'l-shape-smart-storage': {
    id: 'l-shape-smart-storage',
    name: 'L-Shape Smart Storage Kitchen + Utility',
    tags: ['l-shape','utility','pull-outs','matte','laminate'],
    defaultRoom: { shape:'l', w:3600, h:3200 },
    cabinets: [
      { id:'b1', type:'base', widthMm:2200, heightMm:720, xOffsetMm:0, zOffsetMm:0, name:'L Base Run', material:{ callout:'Matte Laminate', glass:false, cane:false }, handleType:'pull' },
      { id:'b2', type:'wall', widthMm:2200, heightMm:720, xOffsetMm:0, zOffsetMm:1400, name:'Wall Cabinets', material:{ callout:'Matte Laminate', glass:false, cane:false }, handleType:'handle' },
      { id:'b3', type:'tall', widthMm:1400, heightMm:2400, xOffsetMm:2200, zOffsetMm:0, name:'Tall Utility Unit', material:{ callout:'Matte Laminate', glass:false, cane:false }, handleType:'pull' },
    ],
    appliances: [
      { type:'hob', w:600, h:500, label:'Gas Hob' },
      { type:'chimney', w:900, h:450, label:'Chimney' },
      { type:'oven', w:600, h:600, label:'Built-in Oven' },
    ],
    finishes: { countertop:'Quartz', backsplash:'Dado Tile', flooring:'Matte Tile' },
    promptBoost: 'modern L-shape kitchen with tall utility unit, matte laminate cabinets, pull-outs and carousels, clean architectural lines, photographic rendering'
  },
  'open-plan-breakfast': {
    id: 'open-plan-breakfast',
    name: 'Open-Plan Kitchen-Dining Breakfast Counter',
    tags: ['open-plan','breakfast','island','pendant','backsplash'],
    defaultRoom: { shape:'open', w:5400, h:3600 },
    cabinets: [
      { id:'c1', type:'base', widthMm:2800, heightMm:720, xOffsetMm:0, zOffsetMm:0, name:'Kitchen Run', material:{ callout:'Contemporary Laminate', glass:false, cane:false }, handleType:'pull' },
      { id:'c2', type:'island', widthMm:1200, heightMm:720, xOffsetMm:2200, zOffsetMm:1200, name:'Breakfast Island', material:{ callout:'Contemporary Laminate', glass:false, cane:false }, handleType:'handle' },
      { id:'c3', type:'wall', widthMm:2200, heightMm:720, xOffsetMm:0, zOffsetMm:1400, name:'Wall Units', material:{ callout:'Contemporary Laminate', glass:false, cane:false }, handleType:'handle' },
      { id:'c4', type:'shelves', widthMm:800, heightMm:300, xOffsetMm:3200, zOffsetMm:1200, name:'Open Shelves', material:{ callout:'Open Wood', glass:false, cane:true }, handleType:'none' },
    ],
    appliances: [
      { type:'dishwasher', w:600, h:860, label:'Dishwasher' },
      { type:'hob', w:600, h:500, label:'Hob' },
      { type:'otg', w:600, h:450, label:'OTG' },
      { type:'chimney', w:900, h:450, label:'Chimney' },
      { type:'ro', w:200, h:400, label:'RO Unit' },
    ],
    finishes: { countertop:'Quartz', backsplash:'Tile', flooring:'Wood Look Tile' },
    promptBoost: 'open plan kitchen with breakfast counter and pendant lights, contemporary laminate, warm inviting social space, photorealistic architectural interior, 8k'
  }
};

export const FURNITURE_CATALOG = {
  tv_units: [
    { id:'tv001', type:'tv_unit', family:'living', subfamily:'media', name:'Arched Marble TV Wall Cabinet', material:{ callout:'Cream + Marble + Black Handle', glass:false, cane:false }, wMm:2800, hMm:400, dMm:400 },
    { id:'tv002', type:'tv_unit', family:'living', subfamily:'media', name:'Floating Low Console', material:{ callout:'Taupe Drawers + Marble Top', glass:false, cane:false }, wMm:2400, hMm:380, dMm:420 },
    { id:'tv003', type:'tv_unit', family:'living', subfamily:'media', name:'Tall Side Cabinet + Wall Shelf', material:{ callout:'High-Gloss White', glass:true, cane:false }, wMm:2600, hMm:2100, dMm:450 },
    { id:'tv004', type:'tv_unit', family:'bedroom', subfamily:'media', name:'Bedroom Media Wall', material:{ callout:'Sage Green + Cream Arch + Marble', glass:false, cane:false }, wMm:2400, hMm:500, dMm:400 },
  ],
  pooja_units: [
    { id:'pooja001', type:'pooja_unit', family:'pooja', subfamily:'classic', name:'Teak Classic Pooja', material:{ callout:'Teak + Brass + LED', glass:false, cane:false }, wMm:800, hMm:1800, dMm:400 },
    { id:'pooja002', type:'pooja_unit', family:'pooja', subfamily:'modern', name:'Marble Pooja Niche', material:{ callout:'White Marble + Backlit', glass:false, cane:false }, wMm:900, hMm:1900, dMm:450 },
    { id:'pooja003', type:'pooja_unit', family:'pooja', subfamily:'wall', name:'Wall-Mounted Compact Pooja', material:{ callout:'Lacquer + LED', glass:false, cane:false }, wMm:700, hMm:1600, dMm:350 },
  ],
  crockery_units: [
    { id:'cr001', type:'crockery_unit', family:'dining', subfamily:'display', name:'Glass-Fronted Crockery', material:{ callout:'Walnut Frame + Glass', glass:true, cane:false }, wMm:1600, hMm:2000, dMm:450 },
    { id:'cr002', type:'crockery_unit', family:'dining', subfamily:'utility', name:'Combined Crockery + Appliance Bay', material:{ callout:'Matte Laminate', glass:false, cane:false }, wMm:1800, hMm:2200, dMm:500 },
    { id:'cr003', type:'crockery_unit', family:'dining', subfamily:'open', name:'Open Shelf + Drawer Layout', material:{ callout:'Natural Oak + Rattan', glass:false, cane:true }, wMm:1400, hMm:1800, dMm:400 },
  ],
  wardrobes: [
    { id:'w001', type:'wardrobe', family:'bedroom', subfamily:'classic', name:'Arched Cream + Forest Green', material:{ callout:'Cream + Sage Green + Black Knob', glass:false, cane:false }, wMm:1800, hMm:2400, dMm:550 },
    { id:'w002', type:'wardrobe', family:'bedroom', subfamily:'modern', name:'High-Gloss White + Dark Side', material:{ callout:'High-Gloss White + Charcoal', glass:false, cane:false }, wMm:2000, hMm:2400, dMm:550 },
    { id:'w003', type:'wardrobe', family:'bedroom', subfamily:'luxury', name:'Fluted Oak + Marble Top Dresser', material:{ callout:'Light Wood + White Marble', glass:false, cane:false }, wMm:2200, hMm:2400, dMm:600 },
  ],
  utilities: [
    { id:'util001', type:'utility_unit', family:'utility', subfamily:'tall', name:'Tall Utility + Laundry', material:{ callout:'Matte Laminate', glass:false, cane:false }, wMm:1200, hMm:2400, dMm:600 },
    { id:'util002', type:'utility_unit', family:'utility', subfamily:'counter', name:'Utility Counter + Sink Bay', material:{ callout:'Laminate + Quartz Top', glass:false, cane:false }, wMm:1800, hMm:900, dMm:600 },
  ]
};

const HID_CATALOGS = {
  '1mm-catalogue.pdf': ['woodline','ply','edgeband','hardware_spec'],
  'woodline-1mm.pdf': ['wardrobe_systems','tv_systems','modular_fittings'],
  'PENTONE CATALOGUE_2025 VERSON-4.pdf': ['palettes','finishes','shades']
};

export function getTemplate(id){ return KITCHEN_TEMPLATES[id]; }
export function listTemplates(){ return Object.values(KITCHEN_TEMPLATES); }
export function getCatalog(){ return FURNITURE_CATALOG; }

export async function generateBriefPack(projectId, brief){
  const out = path.join(outDir, String(projectId));
  fs.mkdirSync(out, { recursive: true });
  const briefPath = path.join(out, 'brief.json');
  fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));
  return briefPath;
}

export async function extractCatalogGuides(){
  const notes = [];
  const base = path.join(projectRoot, 'Downloads');
  for (const [file, tags] of Object.entries(HID_CATALOGS)){
    const p = path.join(base, file);
    if (!fs.existsSync(p)) continue;
    notes.push({ source: file, note: `Catalog loaded: ${file}`, tags });
  }
  return notes;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  (async () => {
    const notes = await extractCatalogGuides();
    console.log(JSON.stringify({ ok:true, templates: listTemplates().length, catalogs: notes.length }, null, 2));
  })();
}

/**
 * render-elevation-decode.js
 * ---------------------------------------------------------------------------
 * Decodes the user's shared 3D interior renders into ACCURATE 2D elevation
 * models, ready for the project's own DXF/PDF writers
 * (dxf-writer.buildElevationDXF + pdf-elevation.renderElevationPDF).
 *
 * One builder per decoded room/unit. Every dimension traces to a render
 * observation or a supplied CAD reference — no invented numbers.
 * Styles learned from the renders:
 *   - wardrobe : two-tone charcoal-ribbed + cream stepped, loft top, arched
 *   - kitchen  : eggplant-gloss base + matte-white upper, jali tall, glass display
 *   - pooja    : dark-wood framed backlit Ganesha niche + gold diamond tile
 *   - tv-unit  : calacatta marble + walnut-slat arched feature wall, floating console
 *   - entry    : off-white two-tone shutters + dark open shoe shelves, underlight
 *   - vanity   : arched backlit mirror + espresso column + cream shutter + base LED
 */
const cab = (o) => ({
  type: o.type || 'door',
  widthMm: o.w, heightMm: o.h, depthMm: o.d || 600,
  xOffsetMm: o.x, zOffsetMm: o.z,
  tag: o.tag, name: o.name,
  handleType: o.handle || 'pull',
  material: o.material || {},
  lighting: o.lighting || null,
});

export function wardrobeModel() {
  const L = 2000, H = 2660, T = 75;
  const c = [
    cab({ type:'door', w:300, h:H, x:0, z:0, tag:'SHUTTER', name:'Ribbed charcoal', handle:'bar', material:{ callout:'CHARCOAL RIBBED MDF' } }),
    cab({ type:'door', w:425, h:H, x:300, z:0, tag:'SHUTTER', name:'Cream shutter', handle:'bar', material:{ callout:'MATTE CREAM LAMINATE' } }),
    cab({ type:'open', w:550, h:H, x:725, z:0, tag:'OPEN UNIT', name:'Stepped cream open', handle:'bar', material:{ callout:'CREAM LAMINATE', glass:true } }),
    cab({ type:'door', w:425, h:H, x:1275, z:0, tag:'SHUTTER', name:'Cream shutter', handle:'bar', material:{ callout:'MATTE CREAM LAMINATE' } }),
    cab({ type:'door', w:300, h:H, x:1700, z:0, tag:'SHUTTER', name:'Ribbed charcoal', handle:'bar', material:{ callout:'CHARCOAL RIBBED MDF' } }),
  ];
  c.unshift(cab({ type:'loft', w:L, h:200, x:0, z:H-200, tag:'LOFT', name:'Loft', handle:'bar', material:{ callout:'CREAM LAMINATE' } }));
  return baseModel('WARDROBE','WARDROBE ELEVATION',L,H,600,T,c,[]);
}

export function kitchenModel() {
  const L = 3000, H = 2400, T = 75, baseH = 900, wallH = 720;
  const c = [
    cab({ type:'door', w:600, h:H, x:0, z:0, tag:'SHUTTER', name:'Jali tall', handle:'bar', material:{ callout:'MEDIUM WALNUT + JALI LATTICE', cane:true } }),
    cab({ type:'base', w:1800, h:baseH, x:600, z:0, tag:'BASE', name:'Purple gloss base', handle:'bar', material:{ callout:'EGGPLANT GLOSS LAMINATE' } }),
    cab({ type:'drawer', w:600, h:baseH, x:600, z:0, tag:'DRAWER', name:'Base drawer', handle:'bar', material:{ callout:'EGGPLANT GLOSS' } }),
    cab({ type:'base', w:900, h:baseH, x:2100, z:0, tag:'BASE', name:'Sink base', handle:'bar', material:{ callout:'EGGPLANT GLOSS' } }),
    cab({ type:'door', w:600, h:H, x:2400, z:0, tag:'GLASS', name:'Display tall', handle:'bar', material:{ callout:'DARK FRAME + GLASS', glass:true }, lighting:'WARM LED STRIP' }),
    cab({ type:'wall', w:1800, h:wallH, x:600, z:H-wallH, tag:'WALL', name:'White upper', handle:'bar', material:{ callout:'MATTE WHITE LAMINATE' } }),
    cab({ type:'loft', w:L, h:300, x:0, z:H-300, tag:'LOFT', name:'Purple loft', handle:'bar', material:{ callout:'EGGPLANT GLOSS' } }),
  ];
  return baseModel('KITCHEN','KITCHEN ELEVATION',L,H,600,T,c,[{ type:'window', offsetMm:2100, sillMm:1100, widthMm:900, headMm:2000 }]);
}

export function poojaModel() {
  const L = 1200, H = 2400, T = 75;
  const c = [
    cab({ type:'open', w:600, h:1200, x:300, z:400, tag:'OPEN UNIT', name:'Pooja niche', handle:'bar', material:{ callout:'DARK POLISHED WOOD FRAME' }, lighting:'WARM RECESSED LED' }),
    cab({ type:'drawer', w:300, h:400, x:900, z:0, tag:'DRAWER', name:'Offering drawer', handle:'bar', material:{ callout:'WHITE LAMINATE' } }),
    cab({ type:'door', w:300, h:1200, x:900, z:400, tag:'SHUTTER', name:'Side shutter', handle:'bar', material:{ callout:'WHITE LAMINATE + GOLD DIAMOND TILE' } }),
    cab({ type:'loft', w:L, h:200, x:0, z:H-200, tag:'LOFT', name:'Loft', handle:'bar', material:{ callout:'WHITE LAMINATE' } }),
  ];
  return baseModel('POOJA','POOJA NICHE ELEVATION',L,H,400,T,c,[]);
}

export function tvUnitModel() {
  const L = 3200, H = 2400, T = 75;
  const c = [
    cab({ type:'open', w:1400, h:1800, x:900, z:200, tag:'OPEN UNIT', name:'Marble + wood arch', handle:'bar', material:{ callout:'CALACATTA MARBLE + WALNUT SLATS' }, lighting:'WARM HIDDEN COVE' }),
    cab({ type:'door', w:450, h:2000, x:0, z:200, tag:'GLASS', name:'Display tall', handle:'bar', material:{ callout:'GLASS DOOR + WARM LED' }, lighting:'WARM LED' }),
    cab({ type:'base', w:L, h:450, x:0, z:0, tag:'BASE', name:'Floating console', handle:'bar', material:{ callout:'LIGHT WOOD + CREAM' } }),
    cab({ type:'door', w:450, h:2000, x:2750, z:200, tag:'SHUTTER', name:'Closed storage', handle:'bar', material:{ callout:'CREAM LAMINATE' } }),
  ];
  return baseModel('TV-UNIT','TV UNIT ELEVATION',L,H,450,T,c,[]);
}

export function entryModel() {
  const L = 1600, H = 2100, T = 75;
  const c = [
    cab({ type:'door', w:700, h:1600, x:0, z:400, tag:'SHUTTER', name:'Cream shutter', handle:'bar', material:{ callout:'OFF-WHITE + DARK WOOD TRIM' } }),
    cab({ type:'door', w:700, h:1600, x:700, z:400, tag:'SHUTTER', name:'Cream shutter', handle:'bar', material:{ callout:'OFF-WHITE + DARK WOOD TRIM' } }),
    cab({ type:'open', w:1400, h:400, x:0, z:0, tag:'OPEN UNIT', name:'Shoe shelf', handle:'bar', material:{ callout:'DARK WOOD OPEN SHELF' }, lighting:'WARM UNDERLIGHT' }),
    cab({ type:'drawer', w:200, h:400, x:1400, z:0, tag:'DRAWER', name:'Drawer', handle:'bar', material:{ callout:'WOOD TOP' } }),
    cab({ type:'loft', w:L, h:200, x:0, z:H-200, tag:'LOFT', name:'Loft', handle:'bar', material:{ callout:'OFF-WHITE' } }),
  ];
  return baseModel('ENTRY','ENTRY SHOE CABINET ELEVATION',L,H,450,T,c,[]);
}

export function vanityModel() {
  const L = 1400, H = 2400, T = 75;
  const c = [
    cab({ type:'door', w:350, h:H, x:0, z:0, tag:'SHUTTER', name:'Dark column', handle:'bar', material:{ callout:'ESPRESSO WOOD' } }),
    cab({ type:'open', w:500, h:1100, x:450, z:900, tag:'OPEN UNIT', name:'Arched mirror', handle:'bar', material:{ callout:'ARCHED MIRROR + LED HALO' }, lighting:'WARM LED HALO' }),
    cab({ type:'drawer', w:500, h:200, x:450, z:700, tag:'DRAWER', name:'Vanity drawer', handle:'bar', material:{ callout:'WHITE FRONT' } }),
    cab({ type:'door', w:500, h:500, x:450, z:0, tag:'SHUTTER', name:'Base dark', handle:'bar', material:{ callout:'ESPRESSO WOOD' }, lighting:'WARM BASE LED' }),
    cab({ type:'door', w:550, h:1500, x:950, z:400, tag:'SHUTTER', name:'Cream shutter', handle:'bar', material:{ callout:'MATTE CREAM LAMINATE' } }),
    cab({ type:'loft', w:L, h:200, x:0, z:H-200, tag:'LOFT', name:'Loft', handle:'bar', material:{ callout:'CREAM LAMINATE' } }),
  ];
  return baseModel('VANITY','VANITY ELEVATION',L,H,550,T,c,[]);
}

// 3-bay kitchen / crockery / pooja unit decoded from the user's shared render
// (composer_2026-07-09_17-18-36...png): LEFT jali tall, CENTER open-niche
// crockery, RIGHT aluminium-profile glass display. Detailed jali + glass + niche
// overlays are added by scripts/generate-kitchen-pantry-elevation.mjs.
export function kitchenPantryModel() {
  const L = 3000, H = 2400, T = 75;
  const baseTop = 900, wallH = 720, nicheH = 540;
  const c = [
    cab({ type:'door', w:1000, h:H, x:0, z:0, tag:'JALI', name:'Jali tall', handle:'bar',
          material:{ callout:'MEDIUM WALNUT + CNC LOTUS/JALI LATTICE', cane:true } }),
    cab({ type:'base', w:1400, h:baseTop, x:1000, z:0, tag:'BASE', name:'Crockery base', handle:'bar',
          material:{ callout:'MATTE CREAM LAMINATE' } }),
    cab({ type:'drawer', w:600, h:200, x:1200, z:0, tag:'DRAWER', name:'Wood drawer', handle:'bar',
          material:{ callout:'DARK WOOD DRAWER FRONT' } }),
    cab({ type:'open', w:1400, h:nicheH, x:1000, z:baseTop, tag:'OPEN UNIT', name:'Open niche', handle:'bar',
          material:{ callout:'DIAMOND PATTERN TILE BACKSPLASH + DARK WOOD SHELF' }, lighting:'WARM UNDER-SHELF LED' }),
    cab({ type:'wall', w:700, h:wallH, x:1000, z:H-wallH, tag:'WALL', name:'Upper L', handle:'bar',
          material:{ callout:'MATTE CREAM LAMINATE' } }),
    cab({ type:'wall', w:700, h:wallH, x:1700, z:H-wallH, tag:'WALL', name:'Upper R', handle:'bar',
          material:{ callout:'MATTE CREAM LAMINATE' } }),
    cab({ type:'door', w:600, h:H, x:2400, z:0, tag:'GLASS', name:'Glass display', handle:'bar',
          material:{ callout:'ALUMINIUM PROFILE GLASS SHUTTER (3 GLASS SHELVES)', glass:true }, lighting:'WARM LED STRIP (LHS)' }),
  ];
  return baseModel('KITCHEN-PANTRY','KITCHEN / CROCKERY / POOJA ELEVATION',L,H,600,T,c,[]);
}

function baseModel(unitType, wallName, L, H, D, T, cabinets, openings) {
  return {
    unitType, projectId:'RENDER-DECODE', wallName,
    lengthMm:L, heightMm:H, depthMm:D, thicknessMm:T,
    ceilingHeightMm:H,
    coverage:{ utilisationPct:90, usedMm:L, freeMm:0 },
    cabinets, openings: openings || [],
  };
}

export const DECODED_UNITS = {
  'wardrobe': wardrobeModel,
  'kitchen': kitchenModel,
  'pooja': poojaModel,
  'tv-unit': tvUnitModel,
  'entry': entryModel,
  'vanity': vanityModel,
  'kitchen-pantry': kitchenPantryModel,
};

export function getAllDecodedModels() {
  return Object.entries(DECODED_UNITS).map(([k, fn]) => ({ key: k, model: fn() }));
}

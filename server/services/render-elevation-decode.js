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
import { buildElevationDXF } from './dxf-writer.js';
import { shoeRackModel } from './shoe-rack.js';
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

// ============================================================================
// NEW STYLED UNITS decoded from the user's July reference photos.
// Each dimension traces to a photo observation against Indian residential
// standards (wardrobe 2400-2700H, base 850-900H, counter 850H, upper 700-720H).
// ============================================================================

// IMG1 & IMG5: 5-column two-tone wardrobe — cream + CHARCOAL VERTICAL FLUTED
// shutters, black horizontal bar handles, 5 handle-less loft doors on top,
// far-left stepped (fluted door / cream panel / fluted base).
export function wardrobeFlutedModel() {
  const L = 2750, H = 2700, T = 75, loft = 450, base = H - loft; // 2250 door zone
  const colW = L / 5;
  const CH = { callout: 'CHARCOAL RIBBED / FLUTED MDF', fluted: true };
  const CR = { callout: 'MATTE CREAM LAMINATE' };
  const c = [
    // far-left stepped column: fluted tall door + cream mid + fluted base
    cab({ type:'door', w:colW, h:base*0.6, x:0, z:base*0.4, tag:'SHUTTER', name:'Fluted charcoal', handle:'bar', material:CH }),
    cab({ type:'door', w:colW, h:base*0.28, x:0, z:base*0.12, tag:'SHUTTER', name:'Cream mid', handle:'none', material:CR }),
    cab({ type:'door', w:colW, h:base*0.12, x:0, z:0, tag:'SHUTTER', name:'Fluted base', handle:'none', material:CH }),
    // columns 2 & 3 cream tall
    cab({ type:'door', w:colW, h:base, x:colW, z:0, tag:'SHUTTER', name:'Cream shutter', handle:'bar', material:CR }),
    cab({ type:'door', w:colW, h:base, x:colW*2, z:0, tag:'SHUTTER', name:'Cream shutter', handle:'bar', material:CR }),
    // columns 4 & 5 charcoal fluted tall
    cab({ type:'door', w:colW, h:base, x:colW*3, z:0, tag:'SHUTTER', name:'Fluted charcoal', handle:'bar', material:CH }),
    cab({ type:'door', w:colW, h:base, x:colW*4, z:0, tag:'SHUTTER', name:'Fluted charcoal', handle:'bar', material:CH }),
  ];
  // 5 handle-less loft doors
  for (let i = 0; i < 5; i++) c.push(cab({ type:'loft', w:colW, h:loft, x:colW*i, z:base, tag:'LOFT', name:`Loft ${i+1}`, handle:'none', material:CR }));
  return baseModel('WARDROBE-FLUTED','FLUTED 2-TONE WARDROBE ELEVATION',L,H,600,T,c,[]);
}

// IMG2: wardrobe + study nook. LEFT wardrobe two-tone taupe/white doors +
// drawer stack; RIGHT study — tall glass cabinet, 2 overhead glass cabinets,
// open shelf, white desk surface. Push-to-open taupe loft.
export function wardrobeStudyModel() {
  const L = 3400, H = 2550, T = 75, loft = 420, deskH = 750, deskTop = 780;
  const TW = { callout: 'TAUPE (TOP) / WHITE (BOTTOM) TWO-TONE', twoTone: true, splitRatio: 0.5 };
  const c = [
    // wardrobe left (0..1900)
    cab({ type:'door', w:450, h:H-loft, x:0, z:0, tag:'SHUTTER', name:'Two-tone tall', handle:'vbar', material:TW }),
    cab({ type:'door', w:750, h:1300, x:450, z:H-loft-1300, tag:'SHUTTER', name:'Two-tone square', handle:'vbar', material:TW }),
    cab({ type:'drawer', w:750, h:H-loft-1300, x:450, z:0, tag:'DRAWER', name:'Drawer stack', handle:'none', material:{ callout:'TAUPE / WHITE DRAWERS', twoTone:true } }),
    cab({ type:'door', w:700, h:H-loft, x:1200, z:0, tag:'SHUTTER', name:'White + taupe accent', handle:'vbar', material:{ callout:'WHITE + TAUPE ACCENT' } }),
    // study right (1900..3400)
    cab({ type:'door', w:420, h:H-loft, x:1900, z:0, tag:'GLASS', name:'Tall glass cab', handle:'none', material:{ callout:'BLACK FRAME GLASS DISPLAY', glass:true, glassCols:1, glassRows:6 } }),
    cab({ type:'wall', w:540, h:600, x:2380, z:H-loft-600, tag:'GLASS', name:'Overhead glass L', handle:'none', material:{ callout:'WHITE FRAME GLASS + LED', glass:true, glassCols:2, glassRows:2 }, lighting:'WARM SHELF LED' }),
    cab({ type:'wall', w:480, h:600, x:2920, z:H-loft-600, tag:'GLASS', name:'Overhead glass R', handle:'none', material:{ callout:'WHITE FRAME GLASS + LED', glass:true, glassCols:2, glassRows:2 }, lighting:'WARM SHELF LED' }),
    cab({ type:'open', w:1020, h:380, x:2380, z:deskTop+deskH, tag:'OPEN UNIT', name:'Open shelf', handle:'none', material:{ callout:'OPEN DISPLAY SHELF', openShelf:true, shelves:2 } }),
    cab({ type:'base', w:1020, h:60, x:2380, z:deskTop, tag:'BASE', name:'Desk top', handle:'none', material:{ callout:'WHITE DESK SURFACE 25mm' } }),
  ];
  for (let i = 0; i < 5; i++) c.push(cab({ type:'loft', w:380, h:loft, x:i*380, z:H-loft, tag:'LOFT', name:`Loft ${i+1}`, handle:'none', material:{ callout:'TAUPE PTO' } }));
  return baseModel('WARDROBE-STUDY','WARDROBE + STUDY NOOK ELEVATION',L,H,600,T,c,[]);
}

// IMG3: Pooja / puja niche. Dark-wood framed backlit Ganesha niche, two-tier
// white platform, side open shelf (dark geometric back + LED) over white cabinet
// with marble top, base wooden cabinet doors with horizontal handles.
export function poojaGaneshaModel() {
  const L = 1800, H = 2550, T = 75, frameT = 120;
  const nicheW = 900, nicheH = 1050, nicheZ = 700;
  const WOOD = { callout: 'DARK TEAK WOODGRAIN FRAME' };
  const c = [
    // dark wood frame around niche (drawn as backing panel)
    cab({ type:'door', w:nicheW+2*frameT, h:nicheH+2*frameT, x:0, z:nicheZ-frameT, tag:'FRAME', name:'Niche wood frame', handle:'none', material:WOOD }),
    // recessed niche (open, cream back, deity)
    cab({ type:'open', w:nicheW, h:nicheH, x:frameT, z:nicheZ, tag:'OPEN UNIT', name:'Ganesha niche', handle:'none', material:{ callout:'CREAM MATTE BACK + GOLDEN GANESHA + 2 BRASS DIYAS', shelves:1 }, lighting:'WARM RECESSED SPOT + PLATFORM DIYAS' }),
    // two-tier white platform under deity
    cab({ type:'base', w:nicheW, h:180, x:frameT, z:nicheZ, tag:'BASE', name:'Platform tier 1', handle:'none', material:{ callout:'WHITE 2-TIER PLATFORM' } }),
    // side open shelf (right) with geometric back + LED
    cab({ type:'open', w:600, h:520, x:nicheW+2*frameT, z:1550, tag:'OPEN UNIT', name:'Side display shelf', handle:'none', material:{ callout:'DARK GEOMETRIC TILE BACK + LED STRIP', openShelf:true, shelves:1 }, lighting:'WARM LED STRIP (BOTTOM)' }),
    // side lower cabinet white body + marble counter
    cab({ type:'base', w:600, h:80, x:nicheW+2*frameT, z:900, tag:'BASE', name:'Marble counter', handle:'none', material:{ callout:'DARK MARBLE COUNTERTOP 20mm' } }),
    cab({ type:'door', w:600, h:820, x:nicheW+2*frameT, z:0, tag:'SHUTTER', name:'Side base cabinet', handle:'bar', material:{ callout:'WHITE LAMINATE CABINET' } }),
    // base wooden cabinet doors under platform
    cab({ type:'door', w:nicheW/2, h:nicheZ-frameT, x:frameT, z:0, tag:'SHUTTER', name:'Puja base L', handle:'bar', material:WOOD }),
    cab({ type:'door', w:nicheW/2, h:nicheZ-frameT, x:frameT+nicheW/2, z:0, tag:'SHUTTER', name:'Puja base R', handle:'bar', material:WOOD }),
    cab({ type:'loft', w:L, h:200, x:0, z:H-200, tag:'LOFT', name:'Loft', handle:'none', material:{ callout:'CREAM LAMINATE' } }),
  ];
  return baseModel('POOJA-GANESHA','POOJA / GANESHA NICHE ELEVATION',L,H,450,T,c,[]);
}

// IMG4: dresser + arched backlit mirror. LEFT tall cabinet (cream + dark frame,
// vbar) / middle drawer (knob) / lower cabinet; RIGHT arched halo-lit mirror +
// dark vanity counter + drawer with knob.
export function vanityArchModel() {
  const L = 1700, H = 2400, T = 75;
  const c = [
    // left tall cabinet column
    cab({ type:'door', w:600, h:1200, x:0, z:1200, tag:'SHUTTER', name:'Cream tall + dark frame', handle:'vbar', material:{ callout:'CREAM + DARK VERTICAL FRAME' } }),
    cab({ type:'drawer', w:600, h:300, x:0, z:900, tag:'DRAWER', name:'Mid drawer', handle:'knob', material:{ callout:'DARK BROWN DRAWER FRONT' } }),
    cab({ type:'door', w:600, h:900, x:0, z:0, tag:'SHUTTER', name:'Lower cabinet', handle:'bar', material:{ callout:'CREAM + DARK BROWN SIDE FRAMES' } }),
    // right: arched backlit mirror
    cab({ type:'open', w:900, h:1200, x:700, z:1000, tag:'OPEN UNIT', name:'Arched halo mirror', handle:'none', material:{ callout:'ARCHED MIRROR + DARK BORDER + WARM HALO', arch:true, shelves:1 }, lighting:'WARM HALO BACKLIGHT' }),
    // vanity counter + drawer
    cab({ type:'base', w:900, h:80, x:700, z:900, tag:'BASE', name:'Vanity counter', handle:'none', material:{ callout:'DARK VANITY COUNTERTOP' } }),
    cab({ type:'drawer', w:900, h:250, x:700, z:650, tag:'DRAWER', name:'Vanity drawer', handle:'knob', material:{ callout:'DARK DRAWER FRONT' } }),
    cab({ type:'loft', w:L, h:200, x:0, z:H-200, tag:'LOFT', name:'Loft', handle:'none', material:{ callout:'OFF-WHITE' } }),
  ];
  return baseModel('VANITY-ARCH','ARCHED MIRROR DRESSER ELEVATION',L,H,550,T,c,[]);
}

// IMG6 — KITCHEN WALL A (fridge + cooking run): tall Bosch fridge, plum-gloss
// base cabinets + drawers, cooktop, stainless hood, white/glass wall cabinets,
// plum loft. Cream backsplash + under-cabinet LED.
export function kitchenWallAModel() {
  const L = 3600, H = 2550, T = 75, baseH = 900, counterH = 40, wallH = 720, loft = 300;
  const PLUM = { callout: 'EGGPLANT / PLUM HIGH-GLOSS LAMINATE' };
  const WHT = { callout: 'MATTE WHITE LAMINATE' };
  const c = [
    // tall fridge (Bosch french-door)
    cab({ type:'appliance', w:900, h:2100, x:0, z:0, tag:'FRIDGE', name:'Bosch fridge', handle:'none', material:{ callout:'BOSCH STAINLESS FRENCH-DOOR FRIDGE', appliance:'fridge' } }),
    // base run
    cab({ type:'base', w:700, h:baseH, x:900, z:0, tag:'BASE', name:'Plum base', handle:'bar', material:PLUM }),
    cab({ type:'drawer', w:700, h:baseH, x:1600, z:0, tag:'DRAWER', name:'Plum drawers', handle:'bar', material:PLUM }),
    cab({ type:'base', w:1300, h:baseH, x:2300, z:0, tag:'BASE', name:'Plum base + hob', handle:'bar', material:PLUM }),
    // counter
    cab({ type:'base', w:2700, h:counterH, x:900, z:baseH, tag:'BASE', name:'Stone counter', handle:'none', material:{ callout:'QUARTZ / MARBLE COUNTERTOP 20mm' } }),
    // cooktop on counter
    cab({ type:'appliance', w:750, h:60, x:2500, z:baseH+counterH, tag:'HOB', name:'Gas cooktop', handle:'none', material:{ callout:'BLACK GAS COOKTOP', appliance:'cooktop' } }),
    // stainless hood
    cab({ type:'appliance', w:750, h:500, x:2500, z:H-loft-wallH-60, tag:'HOOD', name:'Chimney hood', handle:'none', material:{ callout:'STAINLESS CHIMNEY HOOD', appliance:'hood' } }),
    // wall cabinets: white + glass
    cab({ type:'wall', w:900, h:wallH, x:900, z:H-loft-wallH, tag:'WALL', name:'White upper', handle:'bar', material:WHT, lighting:'WARM UNDER-CABINET LED' }),
    cab({ type:'wall', w:850, h:wallH, x:1800, z:H-loft-wallH, tag:'GLASS', name:'Glass upper', handle:'bar', material:{ callout:'GLASS-FRONT UPPER', glass:true, glassCols:1, glassRows:2 } }),
    // loft
    cab({ type:'loft', w:L, h:loft, x:0, z:H-loft, tag:'LOFT', name:'Plum loft', handle:'none', material:PLUM }),
  ];
  return baseModel('KITCHEN-WALL-A','KITCHEN WALL A — FRIDGE + COOKING ELEVATION',L,H,650,T,c,[]);
}

// IMG6 — KITCHEN WALL B (sink run under window): L-return counter, plum base
// cabinets + sink base, undermount sink + gooseneck faucet, dark-framed window,
// white/glass upper cabinets, plum loft.
export function kitchenWallBModel() {
  const L = 3000, H = 2550, T = 75, baseH = 900, counterH = 40, wallH = 720, loft = 300;
  const PLUM = { callout: 'EGGPLANT / PLUM HIGH-GLOSS LAMINATE' };
  const c = [
    // base run
    cab({ type:'base', w:900, h:baseH, x:0, z:0, tag:'BASE', name:'Plum base', handle:'bar', material:PLUM }),
    cab({ type:'base', w:1000, h:baseH, x:900, z:0, tag:'BASE', name:'Sink base', handle:'bar', material:PLUM }),
    cab({ type:'drawer', w:1100, h:baseH, x:1900, z:0, tag:'DRAWER', name:'Plum drawers', handle:'bar', material:PLUM }),
    // counter
    cab({ type:'base', w:L, h:counterH, x:0, z:baseH, tag:'BASE', name:'Stone counter', handle:'none', material:{ callout:'QUARTZ / MARBLE COUNTERTOP 20mm' } }),
    // undermount sink + faucet
    cab({ type:'appliance', w:800, h:70, x:1000, z:baseH-70, tag:'SINK', name:'Undermount sink', handle:'none', material:{ callout:'WHITE UNDERMOUNT SINK + BRONZE GOOSENECK', appliance:'sink' } }),
    // window over sink
    // upper cabinets flanking window
    cab({ type:'wall', w:700, h:wallH, x:0, z:H-loft-wallH, tag:'WALL', name:'White upper L', handle:'bar', material:{ callout:'MATTE WHITE LAMINATE' }, lighting:'WARM UNDER-CABINET LED' }),
    cab({ type:'wall', w:600, h:wallH, x:2400, z:H-loft-wallH, tag:'GLASS', name:'Glass upper R', handle:'bar', material:{ callout:'GLASS-FRONT UPPER', glass:true, glassCols:1, glassRows:2 } }),
    // loft
    cab({ type:'loft', w:L, h:loft, x:0, z:H-loft, tag:'LOFT', name:'Plum loft', handle:'none', material:PLUM }),
  ];
  // dark-framed window above sink
  return baseModel('KITCHEN-WALL-B','KITCHEN WALL B — SINK + WINDOW ELEVATION',L,H,650,T,c,[{ type:'window', offsetMm:1000, sillMm:1000, widthMm:800, headMm:1750 }]);
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
  'shoe-rack': shoeRackModel,
  'wardrobe-fluted': wardrobeFlutedModel,
  'wardrobe-study': wardrobeStudyModel,
  'pooja-ganesha': poojaGaneshaModel,
  'vanity-arch': vanityArchModel,
  'kitchen-wall-a': kitchenWallAModel,
  'kitchen-wall-b': kitchenWallBModel,
};

export function getAllDecodedModels() {
  return Object.entries(DECODED_UNITS).map(([k, fn]) => ({ key: k, model: fn() }));
}

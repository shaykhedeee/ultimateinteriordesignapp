import sharp from 'sharp';
import path from 'path';
const src = 'C:/Users/USER/AppData/Roaming/Hermes/composer-images/composer_2026-07-15_09-22-40-067_27c68c.png';
const out = 'C:/Users/USER/Documents/Muskans autocad solution/THE ULTIMATE INTERIOR DESIGN APPLICATION/tmp_crops';
(async () => {
  const m = await sharp(src).metadata();
  const w = m.width, h = m.height;
  const crops = {
    top:    [0, 0, w, Math.round(h*0.34)],
    bottom: [0, Math.round(h*0.64), w, h - Math.round(h*0.64)],
    left:   [0, 0, Math.round(w*0.36), h],
    right:  [Math.round(w*0.64), 0, w - Math.round(w*0.64), h],
    center: [Math.round(w*0.28), Math.round(h*0.28), Math.round(w*0.44), Math.round(h*0.44)],
  };
  for (const [k,[x,y,cw,ch]] of Object.entries(crops)) {
    await sharp(src).extract({left:x, top:y, width:cw, height:ch}).toFile(path.join(out, 'crop_'+k+'.png'));
  }
  console.log('done', w, h);
})().catch(e => { console.error(e); process.exit(1); });

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const src = 'C:/Users/USER/AppData/Roaming/Hermes/composer-images/composer_2026-07-15_09-22-40-067_27c68c.png';
const out = 'C:/Users/USER/Documents/Muskans autocad solution/THE ULTIMATE INTERIOR DESIGN APPLICATION/tmp_grid';

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const m = await sharp(src).metadata();
  const scale = 3;
  const big = await sharp(src).resize(m.width * scale, m.height * scale, { kernel: 'cubic' }).png().toFile(path.join(out, 'upscaled.png')).then(() => ({ w: m.width * scale, h: m.height * scale }));
  const { w, h } = big;
  const cols = 6, rows = 8;
  const cellW = Math.floor(w / cols), cellH = Math.floor(h / rows);
  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      const left = cx * cellW, top = ry * cellH;
      const ww = cx === cols - 1 ? w - left : cellW;
      const hh = ry === rows - 1 ? h - top : cellH;
      await sharp(path.join(out, 'upscaled.png')).extract({ left, top, width: ww, height: hh }).png().toFile(path.join(out, `g_c${cx}_r${ry}.png`));
    }
  }
  console.log('upscaled', w, 'x', h, '-> 48 grid cells in', out);
})().catch(e => { console.error(e); process.exit(1); });

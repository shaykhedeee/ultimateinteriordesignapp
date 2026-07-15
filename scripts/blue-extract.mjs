import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const src = 'C:/Users/USER/AppData/Roaming/Hermes/composer-images/composer_2026-07-15_09-22-40-067_27c68c.png';
const out = 'C:/Users/USER/Documents/Muskans autocad solution/THE ULTIMATE INTERIOR DESIGN APPLICATION/tmp_blue';

function buildMasks(buf, info) {
  const { width: w, height: h, channels } = info;
  const blue = Buffer.alloc(w * h * 3);
  const black = Buffer.alloc(w * h * 3);
  for (let p = 0; p < w * h; p++) {
    const i = p * channels;
    const r = buf[i], g = buf[i + 1], b = buf[i + 2];
    // Blue ink: saturated blue, clearly higher in blue than red/green
    const isBlue = b > 90 && (b - r) > 45 && (b - g) > 12;
    // Black print / gridlines: low luminance, not blue
    const lum = (r + g + b) / 3;
    const isBlack = lum < 130 && !isBlue && (r < 140 && g < 140 && b < 150);
    const o = p * 3;
    const bv = isBlue ? 0 : 255;
    blue[o] = bv; blue[o + 1] = bv; blue[o + 2] = bv;
    const kv = isBlack ? 0 : 255;
    black[o] = kv; black[o + 1] = kv; black[o + 2] = kv;
  }
  return { w, h, blue, black };
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { w, h, blue, black } = buildMasks(data, info);

  // Save base masks (1x)
  await sharp(blue, { raw: { width: w, height: h, channels: 3 } }).png().toFile(path.join(out, 'blue_mask.png'));
  await sharp(black, { raw: { width: w, height: h, channels: 3 } }).png().toFile(path.join(out, 'black_mask.png'));

  // Upscale 2x for sharper vision reads
  await sharp(blue, { raw: { width: w, height: h, channels: 3 } }).resize(w * 2, h * 2, { kernel: 'cubic' }).png().toFile(path.join(out, 'blue_mask_2x.png'));
  await sharp(black, { raw: { width: w, height: h, channels: 3 } }).resize(w * 2, h * 2, { kernel: 'cubic' }).png().toFile(path.join(out, 'black_mask_2x.png'));

  // Grid crops (4 cols x 3 rows) of the blue mask at 2x for fine reading
  const cols = 4, rows = 3;
  const cw = w * 2, ch = h * 2;
  const cellW = Math.floor(cw / cols), cellH = Math.floor(ch / rows);
  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      const left = cx * cellW, top = ry * cellH;
      const ww = cx === cols - 1 ? cw - left : cellW;
      const hh = ry === rows - 1 ? ch - top : cellH;
      await sharp(path.join(out, 'blue_mask_2x.png')).extract({ left, top, width: ww, height: hh }).png().toFile(path.join(out, `blue_c${cx}_r${ry}.png`));
    }
  }
  console.log('masks + grid crops written to', out, `(base ${w}x${h})`);
})().catch(e => { console.error(e); process.exit(1); });

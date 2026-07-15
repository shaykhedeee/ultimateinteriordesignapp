import sharp from 'sharp';
import path from 'path';
const src = 'C:/Users/USER/AppData/Roaming/Hermes/composer-images/composer_2026-07-15_09-22-40-067_27c68c.png';
const out = 'C:/Users/USER/Documents/Muskans autocad solution/THE ULTIMATE INTERIOR DESIGN APPLICATION/tmp_focus';
(async () => {
  const m = await sharp(src).metadata();
  const w = m.width, h = m.height;
  // Top band: where 3003, 1101, 2210, 9241, 4377, 3235, 50mm live
  await sharp(src).extract({ left: 0, top: 0, width: w, height: Math.round(h * 0.30) })
    .resize(Math.round(w * 2.2), Math.round(h * 0.30 * 2.2), { kernel: 'mitchell' }).png()
    .toFile(path.join(out, 'top_band.png'));
  // Central living/dining with F-1 and surrounding blue dims
  await sharp(src).extract({ left: Math.round(w * 0.25), top: Math.round(h * 0.25), width: Math.round(w * 0.5), height: Math.round(h * 0.5) })
    .resize(Math.round(w * 0.5 * 2.2), Math.round(h * 0.5 * 2.2), { kernel: 'mitchell' }).png()
    .toFile(path.join(out, 'center.png'));
  // Bottom band: 17330, 1502, 3560, 1196, 2948, 585, 2735, 1304, 950, 1961/1964, 3000, 532, 2164
  await sharp(src).extract({ left: 0, top: Math.round(h * 0.68), width: w, height: h - Math.round(h * 0.68) })
    .resize(Math.round(w * 2.2), Math.round((h - h * 0.68) * 2.2), { kernel: 'mitchell' }).png()
    .toFile(path.join(out, 'bottom_band.png'));
  // Left edge: 4697, 674-1498, 1502, 17330
  await sharp(src).extract({ left: 0, top: 0, width: Math.round(w * 0.30), height: h })
    .resize(Math.round(w * 0.30 * 2.2), Math.round(h * 2.2), { kernel: 'mitchell' }).png()
    .toFile(path.join(out, 'left_edge.png'));
  console.log('focus crops written');
})().catch(e => { console.error(e); process.exit(1); });

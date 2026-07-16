import fs from 'node:fs';
import path from 'node:path';

const STORAGE_DIR = path.resolve('storage');
const PANO_DIR = path.join(STORAGE_DIR, 'panoramas');

try { fs.mkdirSync(PANO_DIR, { recursive: true }); } catch {}

export function writePanorama(projectId, base64DataUrl, filenamePrefix = '360') {
  try {
    const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const ext = match[1].includes('png') ? 'png' : 'jpg';
    const fileName = `${filenamePrefix}-${projectId}-${Date.now()}.${ext}`;
    const filePath = path.join(PANO_DIR, fileName);
    fs.writeFileSync(filePath, match[2], 'base64');
    return `/storage/panoramas/${fileName}`;
  } catch {
    return null;
  }
}

export function buildEquirectPlaceholder(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('360 Panorama', width / 2, height / 2);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Generated from current scene', width / 2, height / 2 + 32);
  return canvas.toDataURL('image/jpeg', 0.88);
}

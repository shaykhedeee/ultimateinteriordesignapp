// Shared Three.js material engine for ULTIDA's 3D views (Viewport3D parametric
// world view + Render3DStudio walkthrough). Extracted from Viewport3D so BOTH
// views render identical, catalog-accurate finishes and the texture math is
// unit-testable without a browser/WebGL context.
//
// Pure helpers (resolveFinish / colorToHex) are dependency-free and exported
// for tests; the THREE-dependent builders are guarded so a missing `document`
// (Node test env) doesn't crash the module on import.

import * as THREE from 'three';
import { resolveMaterial } from './materialSlots.js';

// Static fallback palette (mirrors materialSlots.js FALLBACK_PALETTE)
export const LAMINATE_COLORS = {
  lam_1: 0xf3f4f6, // Frosty White
  lam_2: 0xc29a6b, // Warm Oak
  lam_3: 0x1e293b, // Charcoal Matte
  lam_4: 0xe5e5e0, // Light Beige
};

// Map a catalog finish string -> { roughness, metalness } for MeshStandardMaterial.
export function resolveFinish(finish = '') {
  const f = String(finish).toLowerCase();
  if (f.includes('gloss') || f.includes('acrylic')) return { roughness: 0.1, metalness: 0.25 };
  if (f.includes('matte') || f.includes('suede') || f.includes('suede')) return { roughness: 0.85, metalness: 0.05 };
  return { roughness: 0.5, metalness: 0.15 }; // sensible default
}

// '#c29a6b' -> 0xc29a6b  (guards bad input so a typo never throws)
export function colorToHex(input, fallback = 0xf3f4f6) {
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const h = input.trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(h)) {
      try { return parseInt(h, 16); } catch { /* fall through */ }
    }
  }
  return fallback;
}

// Decide which procedural texture (if any) a catalog material should get.
export function pickTexture(catalogMat) {
  if (!catalogMat) return null;
  const name = String(catalogMat.name || '').toLowerCase();
  const finish = String(catalogMat.finish || '').toLowerCase();
  if (name.includes('oak') || name.includes('walnut') || name.includes('wood') ||
      name.includes('ply') || name.includes('wenge') || name.includes('laminate') ||
      name.includes('teak') || name.includes('woodgrain')) {
    return 'woodgrain';
  }
  if (name.includes('marble') || name.includes('stone') || name.includes('granite') ||
      name.includes('quartz') || name.includes('terrazzo')) {
    return 'marble';
  }
  if (finish.includes('textured')) return 'woodgrain';
  return null;
}

// ---- Canvas-texture generators (browser only; guarded) ----
function safeDocument() {
  return (typeof document !== 'undefined') ? document : null;
}

export function createWoodgrainTexture(colorHex) {
  const doc = safeDocument();
  const base = '#' + colorToHex(colorHex).toString(16).padStart(6, '0');
  if (!doc) return null;
  const canvas = doc.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    const x = Math.random() * 256;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 15, 80, x - 15, 170, x, 256);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    const x = Math.random() * 256;
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 8, 256);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  return texture;
}

export function createMarbleTexture(colorHex) {
  const doc = safeDocument();
  const base = '#' + colorToHex(colorHex).toString(16).padStart(6, '0');
  if (!doc) return null;
  const canvas = doc.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, 0);
    ctx.bezierCurveTo(Math.random() * 256, 90, Math.random() * 256, 160, Math.random() * 256, 256);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * 256);
    ctx.bezierCurveTo(80, Math.random() * 256, 170, Math.random() * 256, 256, Math.random() * 256);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Build a MeshStandardMaterial for a given catalog material assignment.
// Honours finish (gloss/matte) and procedural wood/marble textures.
// `catalogMat` may be null -> falls back to a static palette color.
export function buildSlotMaterial(materialId, catalog, renderMode = 'textures') {
  const catalogMat = resolveMaterial(materialId, catalog);
  let colorHex = LAMINATE_COLORS[materialId] || 0xf3f4f6;
  if (catalogMat && catalogMat.color) colorHex = colorToHex(catalogMat.color, colorHex);

  const { roughness, metalness } = resolveFinish(catalogMat ? catalogMat.finish : '');
  let map = null;

  if (renderMode === 'textures' && catalogMat) {
    const tex = pickTexture(catalogMat);
    if (tex === 'woodgrain') map = createWoodgrainTexture(colorHex);
    else if (tex === 'marble') map = createMarbleTexture(colorHex);
  }

  return new THREE.MeshStandardMaterial({
    color: map ? 0xffffff : colorHex,
    map, roughness, metalness,
  });
}

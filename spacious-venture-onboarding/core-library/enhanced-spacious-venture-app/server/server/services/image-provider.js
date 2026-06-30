import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { storageDir } from './database.js';

const palettes = {
  living: ['#7a4c2a', '#b88a2f', '#f4efe3', '#26312d'],
  kitchen: ['#8da48c', '#f5f0df', '#2f6f61', '#3f4742'],
  master: ['#2b2d2b', '#b88a2f', '#ded2bc', '#6f7269'],
  kids: ['#9fb59e', '#eabf9f', '#fff7e8', '#8b5c35'],
  pooja: ['#8b5c35', '#f7f2e8', '#b88a2f', '#6f2f1e'],
  foyer: ['#7a4c2a', '#f5f0df', '#b88a2f', '#1d211d'],
  'whole-home': ['#7a4c2a', '#8da48c', '#b88a2f', '#f7f2e8']
};

export async function generateInteriorAsset({ projectId, room, title, prompt, style, budgetTier, tags }) {
  const id = nanoid(12);
  const base = { id, projectId, room, title, prompt: enhanceInteriorPrompt(prompt, room), style, budgetTier, tags };
  const providers = providerPriority();

  for (const provider of providers) {
    if (provider === 'openai') {
      const live = await tryGenerateOpenAiImage(base);
      if (live) return live;
    }
    if (provider === 'freepik') {
      const live = await tryGenerateFreepikImage(base);
      if (live) return live;
    }
    if (provider === 'pexels') {
      const stock = await tryDownloadPexelsImage(base);
      if (stock) return stock;
    }
    if (provider === 'curated') {
      const curated = tryCopyCuratedFallback(base);
      if (curated) return curated;
    }
  }

  const fileName = `${room}-${id}.svg`;
  const filePath = path.join(storageDir, 'assets', fileName);
  const colors = palettes[room] || palettes['whole-home'];
  const svg = createMockInteriorSvg({ title, room, prompt: base.prompt, colors, style, budgetTier });
  fs.writeFileSync(filePath, svg, 'utf8');
  return {
    id,
    projectId,
    room,
    style,
    budgetTier,
    title,
    prompt: base.prompt,
    negativePrompt: 'No generic western-only styling, no unreadable text, no unrealistic room scale, no cluttered showroom look.',
    filePath: `/storage/assets/${fileName}`,
    tags,
    sourceType: 'mock-generated',
    reusableScore: 86
  };
}

function tryCopyCuratedFallback({ id, projectId, room, title, prompt, style, budgetTier, tags }) {
  try {
    const sourceName = curatedImageFor(room, title);
    if (!sourceName) return null;
    const sourcePath = path.join(process.cwd(), 'images', sourceName);
    if (!fs.existsSync(sourcePath)) return null;
    const fileName = `${room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    fs.copyFileSync(sourcePath, filePath);
    return {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title: `${title} - Curated visual`,
      prompt,
      negativePrompt: negativePrompt(),
      filePath: `/storage/assets/${fileName}`,
      tags: [...tags, 'curated-studio-reference', 'indian-interior'],
      sourceType: 'curated-reference',
      reusableScore: 84
    };
  } catch (err) {
    console.warn(`Curated fallback failed, using mock asset: ${err.message}`);
    return null;
  }
}

async function tryGenerateOpenAiImage({ id, projectId, room, title, prompt, style, budgetTier, tags }) {
  try {
    if (process.env.LIVE_IMAGE_GEN !== 'true' || !process.env.OPENAI_API_KEY) return null;
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI();
    const response = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || '1536x1024',
      quality: process.env.OPENAI_IMAGE_QUALITY || 'high',
      n: 1
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) return null;
    const fileName = `${room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
    return {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title,
      prompt,
      negativePrompt: 'No generic western-only styling, no unreadable text, no unrealistic room scale, no cluttered showroom look.',
      filePath: `/storage/assets/${fileName}`,
      tags,
      sourceType: 'openai-image',
      reusableScore: 94
    };
  } catch (err) {
    console.warn(`Live image generation failed, falling back to mock asset: ${err.message}`);
    return null;
  }
}

async function tryGenerateFreepikImage({ id, projectId, room, title, prompt, style, budgetTier, tags }) {
  try {
    if (process.env.LIVE_IMAGE_GEN !== 'true' || !process.env.FREEPIK_API_KEY) return null;
    const endpoint = process.env.FREEPIK_IMAGE_ENDPOINT || 'https://api.freepik.com/v1/ai/text-to-image/flux-dev';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-freepik-api-key': process.env.FREEPIK_API_KEY
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: process.env.FREEPIK_ASPECT_RATIO || 'widescreen_16_9'
      })
    });
    if (!response.ok) throw new Error(`Freepik ${response.status}`);
    const payload = await response.json();
    const imagePayload = findImagePayload(payload);
    if (!imagePayload) return null;
    const fileName = `${room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    if (imagePayload.kind === 'base64') {
      fs.writeFileSync(filePath, Buffer.from(imagePayload.value, 'base64'));
    } else {
      await downloadToFile(imagePayload.value, filePath);
    }
    return {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title,
      prompt,
      negativePrompt: negativePrompt(),
      filePath: `/storage/assets/${fileName}`,
      tags,
      sourceType: 'freepik-image',
      reusableScore: 92
    };
  } catch (err) {
    console.warn(`Freepik generation failed, trying next provider: ${err.message}`);
    return null;
  }
}

async function tryDownloadPexelsImage({ id, projectId, room, title, prompt, style, budgetTier, tags }) {
  try {
    if (!process.env.PEXELS_API_KEY) return null;
    const query = pexelsQuery(room, style, prompt);
    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', query);
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('per_page', process.env.PEXELS_PER_PAGE || '3');
    const response = await fetch(url, {
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });
    if (!response.ok) throw new Error(`Pexels ${response.status}`);
    const payload = await response.json();
    const photo = payload.photos?.[Math.floor(Math.random() * Math.min(payload.photos.length, 3))];
    const imageUrl = photo?.src?.large2x || photo?.src?.large || photo?.src?.original;
    if (!imageUrl) return null;
    const fileName = `${room}-${id}.jpg`;
    const filePath = path.join(storageDir, 'assets', fileName);
    await downloadToFile(imageUrl, filePath);
    return {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title: `${title} - Pexels Reference`,
      prompt: `${prompt}\nStock reference query: ${query}\nPhotographer: ${photo.photographer || 'Pexels contributor'}`,
      negativePrompt: negativePrompt(),
      filePath: `/storage/assets/${fileName}`,
      tags: [...tags, 'pexels-stock', photo.photographer || 'attributed-reference'],
      sourceType: 'pexels-stock',
      reusableScore: 78
    };
  } catch (err) {
    console.warn(`Pexels fallback failed, using mock asset: ${err.message}`);
    return null;
  }
}

export function getProviderStatus() {
  const status = {
    openai: Boolean(process.env.OPENAI_API_KEY),
    freepik: Boolean(process.env.FREEPIK_API_KEY),
    pexels: Boolean(process.env.PEXELS_API_KEY),
    curated: true,
    mock: true
  };
  const activeLabel = providerPriority().find((provider) => {
    if (provider === 'openai') return status.openai && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'freepik') return status.freepik && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'pexels') return status.pexels;
    if (provider === 'curated') return status.curated;
    return provider === 'mock';
  }) || 'mock';
  return {
    liveImageGenRequested: process.env.LIVE_IMAGE_GEN === 'true',
    liveImageGenReady: process.env.LIVE_IMAGE_GEN === 'true' && (status.openai || status.freepik),
    priority: providerPriority(),
    providers: status,
    activeLabel
  };
}

function providerPriority() {
  const primary = process.env.IMAGE_PROVIDER || 'openai';
  const fallbacks = (process.env.IMAGE_PROVIDER_FALLBACKS || 'freepik,pexels,curated,mock')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([primary, ...fallbacks, 'mock'])];
}

function enhanceInteriorPrompt(prompt, room) {
  return [
    prompt,
    `Render as a polished professional interior design visualization for ${room}.`,
    'Indian contemporary residential context, realistic scale, real materials, natural daylight and warm ambient lighting.',
    'Show clear laminate, veneer, stone, upholstery, lighting, storage, and styling details.',
    'No watermark, no text labels, no distorted furniture, no impossible architecture, no people.'
  ].join(' ');
}

function pexelsQuery(room, style) {
  const roomMap = {
    living: 'luxury Indian living room interior teak tv wall',
    kitchen: 'modern Indian modular kitchen interior',
    master: 'luxury bedroom wardrobe interior',
    kids: 'modern kids bedroom interior',
    pooja: 'modern Indian pooja room mandir interior',
    foyer: 'luxury foyer entry interior storage',
    'whole-home': 'warm contemporary Indian home interior'
  };
  return `${roomMap[room] || 'interior design'} ${style || ''}`.trim();
}

function curatedImageFor(room, title = '') {
  const normalizedTitle = title.toLowerCase();
  const roomMap = {
    living: ['louvered_walnut_tv_1779969578489.png', 'statutario_marble_tv_1779969617129.png', 'cnc_teak_mandir_1779969965502.png'],
    kitchen: ['acrylic_lshape_kitchen_1779969662380.png', 'statutario_marble_tv_1779969617129.png', 'louvered_walnut_tv_1779969578489.png'],
    master: ['smoked_glass_wardrobe_1779969938746.png', 'statutario_marble_tv_1779969617129.png', 'louvered_walnut_tv_1779969578489.png'],
    kids: ['acrylic_lshape_kitchen_1779969662380.png', 'smoked_glass_wardrobe_1779969938746.png', 'louvered_walnut_tv_1779969578489.png'],
    pooja: ['cnc_teak_mandir_1779969965502.png', 'louvered_walnut_tv_1779969578489.png', 'statutario_marble_tv_1779969617129.png'],
    foyer: ['statutario_marble_tv_1779969617129.png', 'louvered_walnut_tv_1779969578489.png', 'smoked_glass_wardrobe_1779969938746.png'],
    'whole-home': ['louvered_walnut_tv_1779969578489.png', 'cnc_teak_mandir_1779969965502.png', 'acrylic_lshape_kitchen_1779969662380.png']
  };
  const choices = roomMap[room] || roomMap['whole-home'];
  if (normalizedTitle.includes('hero') || normalizedTitle.includes('visual language')) return choices[0];
  if (normalizedTitle.includes('material') || normalizedTitle.includes('palette')) return choices[1] || choices[0];
  if (normalizedTitle.includes('styling') || normalizedTitle.includes('concept')) return choices[2] || choices[0];
  const hash = [...`${room}-${title}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return choices[hash % choices.length];
}

function negativePrompt() {
  return 'No generic western-only styling, no unreadable text, no unrealistic room scale, no cluttered showroom look.';
}

async function downloadToFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
}

function findImagePayload(payload) {
  const candidates = [
    payload?.data?.[0]?.b64_json,
    payload?.data?.[0]?.base64,
    payload?.data?.[0]?.url,
    payload?.data?.[0]?.image,
    payload?.data?.image,
    payload?.image,
    payload?.url
  ].filter(Boolean);
  const value = candidates[0];
  if (!value) return null;
  if (typeof value === 'string' && value.startsWith('http')) return { kind: 'url', value };
  if (typeof value === 'string') return { kind: 'base64', value: value.replace(/^data:image\/\w+;base64,/, '') };
  return null;
}

function createMockInteriorSvg({ title, room, prompt, colors, style, budgetTier }) {
  const [a, b, c, d] = colors;
  const escapedTitle = escapeXml(title);
  const escapedPrompt = escapeXml(prompt.slice(0, 118));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c}"/>
      <stop offset="1" stop-color="#e5dac4"/>
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="#5f3b22"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#1d211d" flood-opacity=".22"/>
    </filter>
  </defs>
  <rect width="1200" height="850" fill="url(#wall)"/>
  <path d="M0 650 C250 590 390 690 620 640 C835 594 930 590 1200 652 L1200 850 L0 850Z" fill="#d2c3aa"/>
  <rect x="78" y="80" width="1044" height="620" rx="30" fill="#fffaf0" opacity=".34"/>
  <rect x="120" y="130" width="310" height="500" rx="18" fill="url(#wood)" filter="url(#shadow)"/>
  <g opacity=".7">
    <rect x="150" y="155" width="20" height="450" fill="#2a1b11"/>
    <rect x="205" y="155" width="20" height="450" fill="#2a1b11"/>
    <rect x="260" y="155" width="20" height="450" fill="#2a1b11"/>
    <rect x="315" y="155" width="20" height="450" fill="#2a1b11"/>
    <rect x="370" y="155" width="20" height="450" fill="#2a1b11"/>
  </g>
  <rect x="490" y="150" width="455" height="270" rx="20" fill="${d}" filter="url(#shadow)"/>
  <rect x="535" y="192" width="365" height="188" rx="12" fill="#141614"/>
  <rect x="495" y="470" width="480" height="105" rx="16" fill="${a}" filter="url(#shadow)"/>
  <rect x="535" y="492" width="110" height="60" rx="8" fill="${b}" opacity=".85"/>
  <rect x="675" y="492" width="110" height="60" rx="8" fill="#f5f0df" opacity=".95"/>
  <rect x="815" y="492" width="110" height="60" rx="8" fill="${d}" opacity=".82"/>
  <circle cx="1015" cy="240" r="60" fill="${b}" opacity=".9"/>
  <rect x="970" y="330" width="90" height="235" rx="45" fill="${a}" opacity=".94"/>
  <rect x="690" y="610" width="220" height="48" rx="24" fill="${b}" opacity=".9"/>
  <text x="78" y="760" font-family="Outfit, Arial, sans-serif" font-size="38" font-weight="700" fill="#1d211d">${escapedTitle}</text>
  <text x="78" y="805" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="20" font-weight="600" fill="#5c6258">${escapeXml(room)} - ${escapeXml(style)} - ${escapeXml(budgetTier)}</text>
  <text x="620" y="770" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="18" fill="#5c6258">${escapedPrompt}</text>
</svg>`;
}

function escapeXml(value = '') {
  return value.replace(/[<>&'"]/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  }[char]));
}

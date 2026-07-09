import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import db from '../database/database.js';
import { getGeminiStatus } from './gemini-service.js';
import { isNativeOpenAiKey, openAiKeyType } from './provider-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getDb = () => db;
const storageDir = path.resolve(__dirname, '../../storage');

function resolveKey(provider) {
  const map = {
    openai: ['OPENAI_API_KEY','OPENAI_KEY'],
    anthropic: ['ANTHROPIC_API_KEY'],
    google: ['GOOGLE_AI_API_KEY','GOOGLE_API_KEY'],
    gemini: ['GEMINI_API_KEY'],
    stability: ['STABILITY_API_KEY'],
    midjourney: ['MIDJOURNEY_API_KEY']
  };
  const envKeys = map[provider] || [provider.toUpperCase()+'_API_KEY'];
  for (const k of envKeys) if (process.env[k]) return process.env[k];
  try {
    const row = db.prepare('SELECT key_value FROM api_keys WHERE provider = ? LIMIT 1').get(provider);
    if (row?.key_value) return row.key_value;
  } catch {}
  return process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || null;
}

// A user-supplied key (BYOK UI -> api_keys table, or .env) implies consent to
// live generation. This lets the BYOK system actually drive photoreal renders
// without requiring a separate LIVE_IMAGE_GEN env flag.
function liveEnabled(provider) {
  if (process.env.LIVE_IMAGE_GEN === 'true') return true;
  // provider-specific key present?
  if (provider && resolveKey(provider)) return true;
  // any universal key present?
  return Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.STABILITY_API_KEY);
}

export { isNativeOpenAiKey, openAiKeyType } from './provider-config.js';
export { resolveKey };
export { enhanceInteriorPrompt };

const PROVIDER_COSTS = {
  'gemini-imagen': { perImage: 0.03, currency: 'USD' },
  'openai-image': { perImage: 0.04, currency: 'USD' },
  'openai-gpt-image-1': { perImage: 0.08, currency: 'USD' },
  'freepik-image': { perImage: 0.01, currency: 'USD' },
  'huggingface-image': { perImage: 0, currency: 'USD' },
  'pollinations-image': { perImage: 0, currency: 'USD' },
  'stability-sdxl': { perImage: 0.02, currency: 'USD' },
  'stability-flux': { perImage: 0.035, currency: 'USD' },
  'pexels-stock': { perImage: 0, currency: 'USD' },
  'curated-reference': { perImage: 0, currency: 'USD' },
  'mock-generated': { perImage: 0, currency: 'USD' }
};

const palettes = {
  // Aligned to ULTIDA reference render system: warm white/cream + beige marble
  // + warm walnut/teak + charcoal ribbed + sage/seafoam accent + brass LED + black hw
  living: ['#F4EFE3', '#C9A227', '#2B2D2B', '#7FB0A3'],   // cream, brass, charcoal, sage
  kitchen: ['#F5F0DF', '#8C6A4E', '#B98AA6', '#3F4742'],  // cream, walnut, mauve, charcoal
  master: ['#EDE6D6', '#3A4F4A', '#2B2D2B', '#B98AA6'],   // cream, teal/sage, charcoal, mauve accent
  kids: ['#EABF9F', '#9FB59E', '#FFF7E8', '#8B5C35'],
  pooja: ['#F7F2E8', '#8B5C35', '#C9A227', '#6F2F1E'],    // cream, teak, brass, deep accent
  foyer: ['#F5F0DF', '#2B2D2B', '#C9A227', '#1D211D'],
  'whole-home': ['#F4EFE3', '#7FB0A3', '#C9A227', '#2B2D2B']
};

// ULTIDA signature interior-design language (derived from the studio's
// reference renders). Every photoreal render inherits these so output matches
// the approved visual system: warm-white + beige marble-vein floors, warm
// walnut/teak + charcoal ribbed/fluted two-tone cabinetry, arched mirrors with
// warm halo LED backlight, cove perimeter lighting, channel-tufted headboards,
// sage/seafoam accents, black hardware, Hindu pooja niche with diyas.
const ULTIDA_DESIGN_LANGUAGE = [
  'ULTIDA signature luxury Indian-modern interior language:',
  'warm-white and cream plaster walls, large-format beige/cream marble-veined floors with subtle grey veining and soft reflections,',
  'two-tone cabinetry in warm walnut/teak veneer paired with matte cream and charcoal ribbed/fluted panels, slim black bar handles,',
  'integrated warm (2700K) LED: cove perimeter strip, under-cabinet glow, arched-mirror halo backlight, hidden glow behind wood slats,',
  'channel-tufted upholstered headboard in sage/seafoam or deep teal, black-and-white houndstooth throw, brass accents,',
  'recessed warm downlights, glass-front display cabinets with internal warm lighting, no clutter, editorial styling, photoreal materials.'
].join(' ');

const ROOM_LANGUAGE = {
  master: 'Floor-to-ceiling two-tone wardrobe (cream × charcoal ribbed), arched mirror with warm LED halo, channel-tufted sage/teal headboard, houndstooth throws, marble-vein floor.',
  pooja: 'Dedicated home altar niche in polished teak/walnut with recessed warm spotlight on a brass Ganesha idol, brass diyas with lit flames on a tiered cream platform, gold geometric backsplash, warm ambient glow.',
  kitchen: 'Two-tone modular kitchen: white frosted-glass upper cabinets, mauve/charcoal lower cabinets with long black handles, stainless steel appliances, warm under-cabinet lighting, marble counter, traditional Indian jali/lotus woodwork accent if present.',
  living: 'Wall-to-wall TV feature: warm wood slat panel with arched cutout and hidden LED glow, statutario marble panel, floating beige media console, L-sectional sofa in cream with sage/teal pillows, marble coffee table.',
  foyer: 'Two-tone shoe cabinet (cream upper + dark wood open shoe rack) with warm under-base LED, arched mirror, marble-vein floor, eucalyptus in ribbed vase, Kinfolk-style stacked books.',
  'whole-home': 'Cohesive warm-white luxury: cream walls, beige marble floors, walnut/charcoal ribbed two-tone storage, cove + arched-mirror LED, sage accents, black hardware.'
};

export async function generateInteriorAsset({ projectId, room, title, prompt, style, budgetTier, tags, model = 'auto', reuseFirst = true }) {
  const id = nanoid(12);
  const safeRoom = String(room || 'room').replace(/[^a-zA-Z0-9_-]/g, '_');
  const base = { id, projectId, room, safeRoom, title, prompt: enhanceInteriorPrompt(prompt, room), style, budgetTier, tags };
  const providers = generationProviderPriority({ reuseFirst });

  for (const provider of providers) {
    if (provider === 'library-reuse') {
      const reusable = tryReuseGeneratedAsset(base);
      if (reusable) return reusable;
      continue;
    }
    if (provider === 'gemini-imagen') {
      const live = await tryGenerateGeminiImagen(base);
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'openai-gpt-image-1') {
      const live = await tryGenerateOpenAiGptImage1(base);
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'openai') {
      const live = await tryGenerateOpenAiImage(base);
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'stability-sdxl') {
      const live = await tryGenerateStabilityImage({ ...base, model: 'sdxl' });
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'stability-flux') {
      const live = await tryGenerateStabilityImage({ ...base, model: 'flux' });
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'freepik') {
      const live = await tryGenerateFreepikImage(base);
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'huggingface' || provider === 'hf') {
      const live = await tryGenerateHuggingFaceImage(base);
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'pollinations') {
      const live = await tryGeneratePollinationsImage(base);
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'vyro' || provider === 'imagine') {
      const live = await tryGenerateVyroImage(base);
      if (live) return mirrorAssetToReferenceLibrary(live);
    }
    if (provider === 'pexels') {
      const stock = await tryDownloadPexelsImage(base);
      if (stock) return stock;
    }
    if (provider === 'curated') {
      const curated = await tryCopyCuratedFallback(base);
      if (curated) return curated;
    }
  }

  const fileName = `${safeRoom}-${id}.svg`;
  const filePath = path.join(storageDir, 'assets', fileName);
  const colors = palettes[room] || palettes['whole-home'];
  const svg = createMockInteriorSvg({ title, room, prompt: base.prompt, colors, style, budgetTier });
  fs.writeFileSync(filePath, svg, 'utf8');
  const mockAsset = {
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
  await recordGenerationCost({ projectId, assetId: id, sourceType: 'mock-generated' });
  return mockAsset;
}

function tryReuseGeneratedAsset({ id, projectId, room, title, prompt, style, budgetTier, tags = [] }) {
  try {
    const threshold = Number(process.env.RENDER_REUSE_THRESHOLD || 86);
    const rows = getDb().prepare(`
      SELECT * FROM generated_assets
      WHERE reusable_score >= ?
      ORDER BY created_at DESC
      LIMIT 80
    `).all(threshold);
    const scored = rows.map((row) => {
      const rowTags = safeJson(row.tags, []);
      const tagScore = tags.filter((tag) => rowTags.includes(tag)).length * 4;
      const score =
        (row.room === room ? 35 : 0) +
        (row.style === style ? 20 : 0) +
        (row.budget_tier === budgetTier ? 15 : 0) +
        tagScore +
        Math.min(20, Number(row.reusable_score || 0) / 5);
      return { row, score };
    }).sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best || best.score < threshold) return null;
    const asset = {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title: `${title} - reused library match`,
      prompt,
      negativePrompt: best.row.negative_prompt || negativePrompt(),
      filePath: best.row.file_path,
      tags: [...new Set([...tags, 'library-reuse', `matched:${best.row.id}`])],
      sourceType: 'library-reuse',
      reusableScore: Math.round(best.score),
      reusedFromAssetId: best.row.id
    };
    recordGenerationCost({ projectId, assetId: id, sourceType: 'library-reuse' }).catch(() => {});
    return asset;
  } catch (err) {
    console.warn(`Library reuse lookup failed: ${err.message}`);
    return null;
  }
}

function safeJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function tryCopyCuratedFallback({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
  try {
    const sourceName = curatedImageFor(room, title);
    if (!sourceName) return null;
    const sourcePath = path.join(process.cwd(), 'images', sourceName);
    if (!fs.existsSync(sourcePath)) return null;
    const fileName = `${safeRoom || room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    fs.copyFileSync(sourcePath, filePath);
    const asset = {
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
    await recordGenerationCost({ projectId, assetId: id, sourceType: 'curated-reference' });
    return asset;
  } catch (err) {
    console.warn(`Curated fallback failed, using mock asset: ${err.message}`);
    return null;
  }
}

async function tryGenerateGeminiImagen({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
  const resolved = resolveKey('gemini') || process.env.GEMINI_API_KEY;
  try {
    const keys = geminiImageKeys();
    if (!liveEnabled('gemini') || !keys.length) return null;
    const models = geminiImageModels();
    for (const apiKey of keys) {
      for (const model of models) {
        const result = isImagenModel(model)
          ? await callGeminiImagenPredict({ apiKey, model, prompt })
          : await callGeminiImageGenerateContent({ apiKey, model, prompt });
        if (result?.authFailed) break;
        if (!result?.payload) continue;
        const imagePayload = findImagePayload(result.payload);
        if (!imagePayload) continue;
        const fileName = `${safeRoom || room}-${id}.png`;
        const filePath = path.join(storageDir, 'assets', fileName);
        if (imagePayload.kind === 'base64') {
          fs.writeFileSync(filePath, Buffer.from(imagePayload.value, 'base64'));
        } else {
          await downloadToFile(imagePayload.value, filePath);
        }
        const asset = {
          id,
          projectId,
          room,
          style,
          budgetTier,
          title,
          prompt,
          negativePrompt: negativePrompt(),
          filePath: `/storage/assets/${fileName}`,
          tags: [...tags, 'gemini-imagen', model],
          sourceType: 'gemini-imagen',
          provider: 'gemini',
          model,
          reusableScore: 93
        };
        await recordGenerationCost({ projectId, assetId: id, sourceType: 'gemini-imagen' });
        return asset;
      }
    }
  } catch (err) {
    console.warn(`Gemini Imagen generation failed, trying next provider: ${err.message}`);
    return null;
  }
}

async function callGeminiImagenPredict({ apiKey, model, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: Number(process.env.GEMINI_IMAGE_COUNT || 1),
        aspectRatio: process.env.GEMINI_IMAGE_ASPECT_RATIO || '16:9',
        sampleImageSize: process.env.GEMINI_IMAGE_SIZE || '1K'
      }
    })
  });
  if (!response.ok) {
    console.warn(`Gemini Imagen model ${model} returned ${response.status}; trying next image model/key.`);
    return { status: response.status, authFailed: [401, 403].includes(response.status) };
  }
  return { payload: await response.json() };
}

async function callGeminiImageGenerateContent({ apiKey, model, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        temperature: 0.8
      }
    })
  });
  if (!response.ok) {
    console.warn(`Gemini native image model ${model} returned ${response.status}; trying next image model/key.`);
    return { status: response.status, authFailed: [401, 403].includes(response.status) };
  }
  return { payload: await response.json() };
}

async function tryGenerateOpenAiImage({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
  const resolved = resolveKey('openai') || process.env.OPENAI_API_KEY;
  try {
    if (!liveEnabled('openai') || !resolved) return null;
    if (!isNativeOpenAiKey(resolved)) {
      console.warn('OpenAI image generation skipped: configured key is not an OpenAI Platform image key.');
      return null;
    }
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: resolved });
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
    const response = await openai.images.generate({
      model,
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || '1536x1024',
      quality: process.env.OPENAI_IMAGE_QUALITY || 'high',
      n: 1
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) return null;
    const fileName = `${safeRoom || room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
    const asset = {
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
      provider: 'openai',
      model,
      reusableScore: 94
    };
    await recordGenerationCost({ projectId, assetId: id, sourceType: 'openai-image' });
    return asset;
  } catch (err) {
    console.warn(`Live image generation failed, falling back to mock asset: ${err.message}`);
    return null;
  }
}

async function tryGenerateFreepikImage({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
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
    const fileName = `${safeRoom || room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    if (imagePayload.kind === 'base64') {
      fs.writeFileSync(filePath, Buffer.from(imagePayload.value, 'base64'));
    } else {
      await downloadToFile(imagePayload.value, filePath);
    }
    const asset = {
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
      provider: 'freepik',
      model: endpoint,
      reusableScore: 92
    };
    await recordGenerationCost({ projectId, assetId: id, sourceType: 'freepik-image' });
    return asset;
  } catch (err) {
    console.warn(`Freepik generation failed, trying next provider: ${err.message}`);
    return null;
  }
}

async function tryGenerateHuggingFaceImage({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
  try {
    if (process.env.LIVE_IMAGE_GEN !== 'true' || !process.env.HUGGINGFACE_API_KEY) return null;
    const models = huggingFaceModels();
    for (const model of models) {
      const endpoint = huggingFaceEndpoint(model);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'image/png'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: Number(process.env.HUGGINGFACE_IMAGE_WIDTH || 1280),
            height: Number(process.env.HUGGINGFACE_IMAGE_HEIGHT || 720),
            num_inference_steps: Number(process.env.HUGGINGFACE_STEPS || 28),
            guidance_scale: Number(process.env.HUGGINGFACE_GUIDANCE || 3.5)
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        })
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        console.warn(`Hugging Face image model ${model} failed ${response.status}: ${text.slice(0, 180)}`);
        continue;
      }
      if (!contentType.startsWith('image/')) {
        const text = await response.text();
        console.warn(`Hugging Face image model ${model} returned non-image response: ${text.slice(0, 180)}`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const extension = contentType.includes('jpeg') ? 'jpg' : 'png';
      const fileName = `${safeRoom || room}-${id}.${extension}`;
      const filePath = path.join(storageDir, 'assets', fileName);
      fs.writeFileSync(filePath, buffer);
      const asset = {
        id,
        projectId,
        room,
        style,
        budgetTier,
        title,
        prompt,
        negativePrompt: negativePrompt(),
        filePath: `/storage/assets/${fileName}`,
        tags: [...tags, 'huggingface-image', model],
        sourceType: 'huggingface-image',
        provider: 'huggingface',
        model,
        reusableScore: 91
      };
      await recordGenerationCost({ projectId, assetId: id, sourceType: 'huggingface-image' });
      return asset;
    }
  } catch (err) {
    console.warn(`Hugging Face image generation failed, trying next provider: ${err.message}`);
  }
  return null;
}

async function tryGeneratePollinationsImage({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
  try {
    // Pollinations is the keyless real-image provider and is ON by default so
    // photoreal renders work out-of-the-box (no API key required). It only
    // stands down when explicitly disabled. A BYOK key or LIVE_IMAGE_GEN=true
    // still takes precedence for the premium providers.
    if (process.env.POLLINATIONS_ENABLED === 'false') return null;
    const width = Number(process.env.POLLINATIONS_IMAGE_WIDTH || 1280);
    const height = Number(process.env.POLLINATIONS_IMAGE_HEIGHT || 720);
    const model = process.env.POLLINATIONS_IMAGE_MODEL || 'flux';
    const seed = Math.abs(hashString(`${projectId}-${room}-${title}-${prompt}`));
    const url = new URL(`${(process.env.POLLINATIONS_IMAGE_BASE || 'https://image.pollinations.ai/prompt').replace(/\/$/, '')}/${encodeURIComponent(prompt)}`);
    url.searchParams.set('width', String(width));
    url.searchParams.set('height', String(height));
    url.searchParams.set('model', model);
    url.searchParams.set('seed', String(seed));
    url.searchParams.set('nologo', 'true');
    url.searchParams.set('private', 'true');
    url.searchParams.set('enhance', 'true');
    url.searchParams.set('safe', 'true');

    const fileName = `${safeRoom || room}-${id}.jpg`;
    const filePath = path.join(storageDir, 'assets', fileName);
    const response = await fetch(url, {
      headers: process.env.POLLINATIONS_API_KEY ? { Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}` } : {}
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) throw new Error(`Pollinations ${response.status}`);
    if (!contentType.startsWith('image/')) {
      const text = await response.text();
      throw new Error(`Pollinations returned non-image response: ${text.slice(0, 160)}`);
    }
    fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
    const asset = {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title,
      prompt,
      negativePrompt: negativePrompt(),
      filePath: `/storage/assets/${fileName}`,
      tags: [...tags, 'pollinations-image', model],
      sourceType: 'pollinations-image',
      provider: 'pollinations',
      model,
      reusableScore: 84
    };
    await recordGenerationCost({ projectId, assetId: id, sourceType: 'pollinations-image' });
    return asset;
  } catch (err) {
    console.warn(`Pollinations generation failed, trying next provider: ${err.message}`);
    return null;
  }
}

async function tryDownloadPexelsImage({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
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
    const fileName = `${safeRoom || room}-${id}.jpg`;
    const filePath = path.join(storageDir, 'assets', fileName);
    await downloadToFile(imageUrl, filePath);
    const asset = {
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
    await recordGenerationCost({ projectId, assetId: id, sourceType: 'pexels-stock' });
    return asset;
  } catch (err) {
    console.warn(`Pexels fallback failed, using mock asset: ${err.message}`);
    return null;
  }
}

async function tryGenerateStabilityImage({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags, model = 'sdxl' }) {
  const resolved = resolveKey('stability') || process.env.STABILITY_API_KEY;
  try {
    if (!liveEnabled('stability') || !resolved) return null;
    const modelMap = {
      'sdxl': 'stable-diffusion-xl-1024-v1-0',
      'flux': 'stable-diffusion-3-large'
    };
    const stabilityModel = modelMap[model] || modelMap['sdxl'];
    const endpoint = `https://api.stability.ai/v2beta/stable-image/generate/sd3`;
    
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', stabilityModel);
    formData.append('aspect_ratio', process.env.STABILITY_ASPECT_RATIO || '16:9');
    formData.append('output_format', 'png');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'image/*'
      },
      body: formData
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Stability ${response.status}: ${errText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const fileName = `${safeRoom || room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    const asset = {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title,
      prompt,
      negativePrompt: negativePrompt(),
      filePath: `/storage/assets/${fileName}`,
      tags: [...tags, `stability-${model}`],
      sourceType: `stability-${model}`,
      provider: 'stability',
      model: stabilityModel,
      reusableScore: 91
    };
    await recordGenerationCost({ projectId, assetId: id, sourceType: `stability-${model}` });
    return asset;
  } catch (err) {
    console.warn(`Stability AI (${model}) generation failed: ${err.message}`);
    return null;
  }
}

async function tryGenerateOpenAiGptImage1({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
  try {
    const gptKey = resolveKey('openai') || process.env.OPENAI_API_KEY;
    if (!liveEnabled('openai') || !gptKey) return null;
    if (!isNativeOpenAiKey(gptKey)) {
      console.warn('OpenAI gpt-image-1 skipped: configured key is not an OpenAI Platform image key.');
      return null;
    }
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: gptKey });
    const response = await openai.images.generate({
      model: (getProviderModels().openai && getProviderModels().openai[0]) || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || '1536x1024',
      quality: process.env.OPENAI_IMAGE_QUALITY || 'high',
      n: 1
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) return null;
    const fileName = `${safeRoom || room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
    const asset = {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title,
      prompt,
      negativePrompt: negativePrompt(),
      filePath: `/storage/assets/${fileName}`,
      tags: [...tags, 'openai-gpt-image-1'],
      sourceType: 'openai-gpt-image-1',
      provider: 'openai',
      model: 'gpt-image-1',
      reusableScore: 95
    };
    await recordGenerationCost({ projectId, assetId: id, sourceType: 'openai-gpt-image-1' });
    return asset;
  } catch (err) {
    console.warn(`OpenAI gpt-image-1 generation failed: ${err.message}`);
    return null;
  }
}

async function tryGenerateVyroImage({ id, projectId, room, safeRoom, title, prompt, style, budgetTier, tags }) {
  try {
    if (process.env.LIVE_IMAGE_GEN !== 'true' || !process.env.IMAGINE_ART_API_KEY) return null;
    const url = 'https://api.vyro.ai/v2/image/generations';
    const formdata = new FormData();
    formdata.append('prompt', prompt);
    formdata.append('aspect_ratio', '16:9');
    formdata.append('style', 'realistic');
    formdata.append('variation', 'v5'); // fallback variation parameter

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.IMAGINE_ART_API_KEY}`
      },
      body: formdata
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Vyro AI v2 error ${response.status}: ${text}`);
    }

    const buffer = await response.arrayBuffer();
    const fileName = `${safeRoom || room}-${id}.png`;
    const filePath = path.join(storageDir, 'assets', fileName);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    const asset = {
      id,
      projectId,
      room,
      style,
      budgetTier,
      title,
      prompt,
      negativePrompt: negativePrompt(),
      filePath: `/storage/assets/${fileName}`,
      tags: [...tags, 'vyro-imagine'],
      sourceType: 'vyro-imagine',
      provider: 'vyro',
      model: 'image/generations',
      reusableScore: 92
    };
    await recordGenerationCost({ projectId, assetId: id, sourceType: 'vyro-imagine' });
    return asset;
  } catch (err) {
    console.warn(`Vyro/Imagine.art generation failed, trying next: ${err.message}`);
    return null;
  }
}

export function getProviderStatus() {
  const geminiImagenConfigured = geminiImageKeys().length > 0;
  const openAiPlatformConfigured = isNativeOpenAiKey(process.env.OPENAI_API_KEY);
  const clientSafeProviders = {
    geminiImagen: geminiImagenConfigured,
    openai: openAiPlatformConfigured,
    'openai-gpt-image-1': openAiPlatformConfigured,
    freepik: Boolean(process.env.FREEPIK_API_KEY),
    huggingface: Boolean(process.env.HUGGINGFACE_API_KEY),
    'stability-sdxl': Boolean(process.env.STABILITY_API_KEY),
    'stability-flux': Boolean(process.env.STABILITY_API_KEY),
    vyro: Boolean(process.env.IMAGINE_ART_API_KEY)
  };
  const status = {
    geminiImagen: geminiImagenConfigured,
    openai: openAiPlatformConfigured,
    'openai-gpt-image-1': openAiPlatformConfigured,
    freepik: Boolean(process.env.FREEPIK_API_KEY),
    huggingface: Boolean(process.env.HUGGINGFACE_API_KEY),
    pollinations: process.env.POLLINATIONS_ENABLED !== 'false',
    pexels: Boolean(process.env.PEXELS_API_KEY),
    'stability-sdxl': Boolean(process.env.STABILITY_API_KEY),
    'stability-flux': Boolean(process.env.STABILITY_API_KEY),
    vyro: Boolean(process.env.IMAGINE_ART_API_KEY),
    gemini: getGeminiStatus().configured,
    curated: true,
    mock: true
  };
  const activeLabel = providerPriority().find((provider) => {
    if (provider === 'library-reuse') return true;
    if (provider === 'gemini-imagen') return status.geminiImagen && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'openai-gpt-image-1') return status['openai-gpt-image-1'] && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'openai') return status.openai && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'stability-sdxl') return status['stability-sdxl'] && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'stability-flux') return status['stability-flux'] && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'freepik') return status.freepik && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'huggingface' || provider === 'hf') return status.huggingface && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'pollinations') return status.pollinations && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'vyro' || provider === 'imagine') return status.vyro && process.env.LIVE_IMAGE_GEN === 'true';
    if (provider === 'pexels') return status.pexels;
    if (provider === 'curated') return status.curated;
    return provider === 'mock';
  }) || 'mock';
  return {
    liveImageGenRequested: process.env.LIVE_IMAGE_GEN === 'true',
    liveImageGenReady: process.env.LIVE_IMAGE_GEN === 'true' && (status.geminiImagen || status.openai || status['openai-gpt-image-1'] || status.freepik || status.huggingface || status.pollinations || status['stability-sdxl'] || status['stability-flux'] || status.vyro),
    clientSafeLiveReady: process.env.LIVE_IMAGE_GEN === 'true' && Object.values(clientSafeProviders).some(Boolean),
    clientSafeProviders,
    draftOnlyProviders: {
      pollinations: status.pollinations,
      pexels: status.pexels,
      curated: status.curated,
      mock: status.mock
    },
    priority: providerPriority(),
    generationPriority: generationProviderPriority({ reuseFirst: true }),
    providers: status,
    spendMode: process.env.AI_SPEND_MODE || 'smart-cost',
    reuseThreshold: Number(process.env.RENDER_REUSE_THRESHOLD || 86),
    maxAutoRenderVariants: Number(process.env.MAX_AUTO_RENDER_VARIANTS || 2),
    geminiImagen: {
      configured: geminiImagenConfigured,
      model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
      nativeFallbackModels: ['gemini-2.5-flash-image', 'gemini-3.1-flash-image'],
      note: 'The adapter tries native Gemini image generateContent models and then Imagen predict models when access is available.',
      aspectRatio: process.env.GEMINI_IMAGE_ASPECT_RATIO || '16:9',
      sampleImageSize: process.env.GEMINI_IMAGE_SIZE || '1K'
    },
    stability: {
      configured: Boolean(process.env.STABILITY_API_KEY),
      models: ['sdxl', 'flux']
    },
    openai: {
      configured: openAiPlatformConfigured,
      configuredKeyType: openAiKeyType(),
      models: ['gpt-image-1', 'dall-e-3']
    },
    huggingface: {
      configured: Boolean(process.env.HUGGINGFACE_API_KEY),
      models: huggingFaceModels(),
      recommendedFreeModel: 'black-forest-labs/FLUX.1-schnell'
    },
    pollinations: {
      configured: process.env.POLLINATIONS_ENABLED !== 'false',
      model: process.env.POLLINATIONS_IMAGE_MODEL || 'flux',
      note: 'Zero-cost public fallback for draft renders. Use for exploration, not final client renders when premium providers are available.'
    },
    promptRefinement: getGeminiStatus(),
    activeLabel
  };
}

function providerPriority() {
  const primary = process.env.IMAGE_PROVIDER || 'library-reuse';
  const fallbacks = (process.env.IMAGE_PROVIDER_FALLBACKS || 'gemini-imagen,openai-gpt-image-1,openai,huggingface,stability-sdxl,stability-flux,freepik,pollinations,pexels,curated,mock')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([primary, ...fallbacks, 'mock'])];
}

function generationProviderPriority({ reuseFirst = true } = {}) {
  const providers = reuseFirst === false
    ? providerPriority().filter((provider) => provider !== 'library-reuse')
    : providerPriority();
  return providers.filter((provider) => {
    if (provider === 'openai' || provider === 'openai-gpt-image-1') {
      // Honour a key entered via the BYOK UI (api_keys table) too, not just env.
      return Boolean(resolveKey('openai'));
    }
    return true;
  });
}

function geminiImageModels() {
  // Prefer the DB-backed allow-list (set via the BYOK UI picker). This lets a
  // user pin exactly the models their key is permitted to call, avoiding 401s.
  const dbModels = getProviderModels().gemini;
  if (Array.isArray(dbModels) && dbModels.length) return [...new Set(dbModels.map((m) => String(m).trim()).filter(Boolean))];
  // Allow the user to pin an exact, key-authorized model list via env (comma-separated).
  const explicit = (process.env.GEMINI_IMAGE_MODELS || '').split(',').map((m) => m.trim()).filter(Boolean);
  if (explicit.length) return [...new Set(explicit)];
  const configured = process.env.GEMINI_IMAGE_MODEL || '';
  const nativeModels = [
    !isImagenModel(configured) ? configured : '',
    process.env.GEMINI_NATIVE_IMAGE_MODEL,
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image'
  ];
  const imagenModels = [
    isImagenModel(configured) ? configured : '',
    'imagen-4.0-generate-001'
  ];
  return [...new Set([...nativeModels, ...imagenModels].filter(Boolean))];
}

function getProviderModels() {
  try {
    const row = db.prepare('SELECT models_json FROM provider_models WHERE id = ?').get('default');
    if (row?.models_json) return JSON.parse(row.models_json);
  } catch (e) { /* table may not exist yet */ }
  return {};
}

function isImagenModel(model = '') {
  return String(model).startsWith('imagen-');
}

function huggingFaceModels() {
  return (process.env.HUGGINGFACE_IMAGE_MODELS || process.env.HUGGINGFACE_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function huggingFaceEndpoint(model) {
  const base = process.env.HUGGINGFACE_IMAGE_ENDPOINT_BASE || 'https://router.huggingface.co/hf-inference/models';
  return `${base.replace(/\/$/, '')}/${model}`;
}

function mirrorAssetToReferenceLibrary(asset) {
  try {
    if (!asset?.filePath || asset.sourceType === 'library-reuse' || asset.sourceType === 'pexels-stock') return asset;
    const tags = [...new Set([...(asset.tags || []), asset.room, asset.style, asset.budgetTier, asset.sourceType].filter(Boolean))];
    const metadata = {
      title: asset.title,
      tags,
      attribution: `AI generated by ${asset.provider || asset.sourceType || 'configured provider'}`,
      sourceUrl: asset.filePath,
      generatedAssetId: asset.id,
      projectId: asset.projectId,
      prompt: asset.prompt,
      negativePrompt: asset.negativePrompt || negativePrompt(),
      consent: 'studio-generated-reference'
    };
    getDb().prepare(`
      INSERT OR REPLACE INTO reference_library
      (id, filename, category, subcategory, style, budget_tier, image_path, thumbnail_path, metadata_json, ai_training_ready, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      `generated-${asset.id}`,
      path.basename(asset.filePath),
      asset.room || 'generated-renders',
      asset.sourceType || 'ai-generated',
      asset.style || 'ai-generated',
      asset.budgetTier || 'premium',
      asset.filePath,
      asset.filePath,
      JSON.stringify(metadata),
      'ai-generated'
    );
  } catch (err) {
    console.warn(`Reference library mirror failed: ${err.message}`);
  }
  return asset;
}

function geminiImageKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_AI_STUDIO_KEY_1,
    process.env.GOOGLE_AI_STUDIO_KEY_2,
    resolveKey('gemini'),
    resolveKey('google')
  ].filter(Boolean);
}

function enhanceInteriorPrompt(prompt, room) {
  const roomLanguage = ROOM_LANGUAGE[room] || ROOM_LANGUAGE['whole-home'];
  return [
    prompt,
    `Render as a Lumion-like professional 3D architectural interior visualization for ${room}.`,
    ULTIDA_DESIGN_LANGUAGE,
    `Room-specific composition: ${roomLanguage}`,
    'Indian contemporary luxury residential context, realistic scale, real materials, corrected perspective, straight verticals, natural daylight balanced with warm ambient lighting and editorial styling.',
    'Show clear laminate, veneer, fluted/ribbed wood, stone, upholstery, integrated LED lighting, storage, and styling details with photoreal surface response.',
    'Strict exclusions: no humans, no human figures, no silhouettes, no mannequins, no pets, no watermark, no text labels, no logos, no distorted furniture, no impossible architecture, no unrequested objects, no cold blue corporate palette, no cheap flat renders.'
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
  return 'No people, no human figures, no silhouettes, no mannequins, no pets, no watermarks, no logos, no readable text, no generic western-only styling, no unrealistic room scale, no bad perspective, no distorted furniture, no impossible windows, no cluttered showroom look, no unrequested decor objects.';
}

async function downloadToFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
}

function findImagePayload(payload) {
  const candidates = [
    payload?.predictions?.[0]?.bytesBase64Encoded,
    payload?.predictions?.[0]?.mimeType && payload?.predictions?.[0]?.bytesBase64Encoded,
    payload?.predictions?.[0]?.image?.bytesBase64Encoded,
    payload?.predictions?.[0]?.image,
    payload?.predictions?.[0]?.url,
    payload?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data,
    payload?.candidates?.[0]?.content?.parts?.find((part) => part.inline_data?.data)?.inline_data?.data,
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

function hashString(value = '') {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

export function getProviderCost(sourceType) {
  return PROVIDER_COSTS[sourceType] || { perImage: 0, currency: 'USD' };
}

export { geminiImageModels, generationProviderPriority };

export async function recordGenerationCost({ projectId, assetId, sourceType, count = 1 }) {
  const costInfo = getProviderCost(sourceType);
  const totalCost = costInfo.perImage * count;
  const db = getDb();
  
  try {
    db.prepare(`
      INSERT INTO generation_costs (id, project_id, asset_id, source_type, count, unit_cost, total_cost, currency, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nanoid(12),
      projectId,
      assetId || null,
      sourceType,
      count,
      costInfo.perImage,
      totalCost,
      costInfo.currency,
      new Date().toISOString()
    );
  } catch (err) {
    console.warn('Cost recording failed (table may not exist):', err.message);
  }
  
  return { totalCost, currency: costInfo.currency };
}

export async function getProjectCostSummary(projectId) {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT source_type, SUM(count) as total_images, SUM(total_cost) as total_cost, currency
      FROM generation_costs
      WHERE project_id = ?
      GROUP BY source_type, currency
    `).all(projectId);
    
    const total = rows.reduce((sum, r) => sum + (r.total_cost || 0), 0);
    return { byProvider: rows, totalCost: total, currency: 'USD' };
  } catch (err) {
    return { byProvider: [], totalCost: 0, currency: 'USD' };
  }
}

export async function getStudioCostSummary() {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT source_type, COUNT(*) as generations, SUM(total_cost) as total_cost
      FROM generation_costs
      GROUP BY source_type
      ORDER BY total_cost DESC
    `).all();
    
    const total = rows.reduce((sum, r) => sum + (r.total_cost || 0), 0);
    return { byProvider: rows, totalCost: total, currency: 'USD' };
  } catch (err) {
    return { byProvider: [], totalCost: 0, currency: 'USD' };
  }
}

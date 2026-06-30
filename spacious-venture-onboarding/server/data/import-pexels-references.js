import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { ensureDatabase, getDb, storageDir } from '../services/database.js';

const apiKey = process.env.PEXELS_API_KEY;
const importRoot = path.join(storageDir, 'reference', 'pexels-imports');

const searches = [
  { query: 'modern luxury living room interior no people', room: 'living-room', style: 'modern-luxury', budgetTier: 'premium', count: 3 },
  { query: 'warm beige living room tv wall interior no people', room: 'living-room', style: 'indian-contemporary', budgetTier: 'premium', count: 3 },
  { query: 'modern modular kitchen interior no people', room: 'kitchen', style: 'warm-minimal', budgetTier: 'premium', count: 3 },
  { query: 'matte sage green kitchen interior no people', room: 'kitchen', style: 'indian-contemporary', budgetTier: 'comfort', count: 2 },
  { query: 'modern bedroom wardrobe interior no people', room: 'bedroom', style: 'contemporary-classic', budgetTier: 'premium', count: 3 },
  { query: 'kids bedroom storage interior no people', room: 'kids-bedroom', style: 'scandinavian-minimal', budgetTier: 'comfort', count: 2 },
  { query: 'home office study interior wood desk no people', room: 'study-home-office', style: 'japandi', budgetTier: 'comfort', count: 2 },
  { query: 'modern dining room crockery cabinet interior no people', room: 'dining-area', style: 'modern-luxury', budgetTier: 'premium', count: 2 },
  { query: 'entryway shoe cabinet mirror interior no people', room: 'foyer-storage', style: 'indian-contemporary', budgetTier: 'comfort', count: 2 },
  { query: 'modern pooja room mandir interior no people', room: 'pooja-unit', style: 'indian-contemporary', budgetTier: 'premium', count: 2 }
];

ensureDatabase();

if (!apiKey) {
  console.log(JSON.stringify({ imported: 0, skipped: 'PEXELS_API_KEY missing' }, null, 2));
  process.exit(0);
}

fs.mkdirSync(importRoot, { recursive: true });
const db = getDb();
const insert = db.prepare(`
  INSERT OR REPLACE INTO reference_library
  (id, filename, category, style, budget_tier, image_path, thumbnail_path, metadata_json, ai_training_ready, source, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'pexels-stock', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

let imported = 0;
const results = [];

for (const item of searches) {
  const endpoint = new URL('https://api.pexels.com/v1/search');
  endpoint.searchParams.set('query', item.query);
  endpoint.searchParams.set('orientation', 'landscape');
  endpoint.searchParams.set('per_page', String(Math.max(item.count, 3)));

  const response = await fetch(endpoint, { headers: { Authorization: apiKey } });
  if (!response.ok) {
    results.push({ query: item.query, status: response.status, imported: 0 });
    continue;
  }
  const payload = await response.json();
  const photos = (payload.photos || []).slice(0, item.count);
  const roomDir = path.join(importRoot, item.room);
  fs.mkdirSync(roomDir, { recursive: true });

  let roomImported = 0;
  for (const photo of photos) {
    const id = `pexels-${photo.id}`;
    const filename = `${photo.id}-${slug(photo.alt || item.query)}.jpg`;
    const localPath = path.join(roomDir, filename);
    const imageUrl = photo.src?.large2x || photo.src?.large || photo.src?.original;
    if (!imageUrl) continue;

    if (!fs.existsSync(localPath)) {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) continue;
      const bytes = Buffer.from(await imageResponse.arrayBuffer());
      fs.writeFileSync(localPath, bytes);
    }

    const imagePath = `/storage/reference/pexels-imports/${item.room}/${filename}`;
    const metadata = {
      title: photo.alt || titleCase(item.query),
      tags: [
        item.room,
        item.style,
        item.budgetTier,
        'stock-reference',
        'client-safe',
        'no-people-preferred'
      ],
      attribution: `Pexels / ${photo.photographer || 'Pexels contributor'}`,
      sourceUrl: photo.url,
      pexelsId: photo.id,
      consent: 'pexels-api-attributed-reference',
      importedBatchId: nanoid(8)
    };

    insert.run(id, filename, item.room, item.style, item.budgetTier, imagePath, imagePath, JSON.stringify(metadata));
    imported += 1;
    roomImported += 1;
  }
  results.push({ query: item.query, room: item.room, imported: roomImported });
}

console.log(JSON.stringify({ imported, results }, null, 2));

function slug(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'interior-reference';
}

function titleCase(value = '') {
  return String(value)
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+No People\b/i, '');
}

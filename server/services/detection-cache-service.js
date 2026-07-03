import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../storage');

/**
 * DetectionCacheService
 *
 * File-system detection cache keyed by:
 * - image hash (sha256 of base64 payload)
 * - model identifier + version
 * - room type / context
 *
 * Stores JSON bundles with:
 * - components[] with confidence scores
 * - overallConfidence
 * - detectionMetadata.provider / modelVersion / detectedAt / roomType / source
 */

const MAX_ENTRIES = 5000;
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

class DetectionCacheService {
  constructor(storageDirLocal = storageDir) {
    this.storageDir = storageDirLocal;
    this.cacheDir = path.join(this.storageDir, 'detection-cache');
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    } catch {}
  }

  _hashImage(base64Image) {
    try {
      const data = String(base64Image || '').replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(data, 'base64');
      return `img_${buffer.byteLength}_${String(buffer.length)}`; // cheap length-based id for same-buffer reuse
    } catch {
      return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }

  _entryPath(cacheKey) {
    const safe = String(cacheKey).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    return path.join(this.cacheDir, `${safe}.json`);
  }

  buildKey(base64Image, modelId, roomType) {
    const imgKey = this._hashImage(base64Image);
    const room = String(roomType || 'global').toLowerCase();
    return `${imgKey}__${String(modelId || 'unknown').toLowerCase()}__${room}`;
  }

  get(base64Image, modelId, roomType) {
    const key = this.buildKey(base64Image, modelId, roomType);
    try {
      const p = this._entryPath(key);
      if (!fs.existsSync(p)) return null;
      const raw = fs.readFileSync(p, 'utf8');
      const entry = JSON.parse(raw);
      if (entry && entry.validUntil && Date.now() < entry.validUntil) {
        return entry;
      }
      fs.unlinkSync(p);
    } catch {
      // ignore missing cache
    }
    return null;
  }

  set(base64Image, modelId, roomType, payload, ttlMs = DEFAULT_TTL_MS) {
    const key = this.buildKey(base64Image, modelId, roomType);
    try {
      const entry = {
        key,
        modelId: String(modelId || 'unknown'),
        roomType: String(roomType || 'global'),
        createdAt: new Date().toISOString(),
        validUntil: Date.now() + ttlMs,
        payload
      };
      fs.writeFileSync(this._entryPath(key), JSON.stringify(entry), 'utf8');
      this._enforceMaxEntries();
      return entry;
    } catch {
      return null;
    }
  }

  _enforceMaxEntries() {
    try {
      const files = fs.readdirSync(this.cacheDir).filter((f) => f.endsWith('.json'));
      if (files.length > MAX_ENTRIES) {
        files.sort().slice(0, files.length - MAX_ENTRIES).forEach((f) => {
          try { fs.unlinkSync(path.join(this.cacheDir, f)); } catch {}
        });
      }
    } catch {}
  }

  clear(olderThanMs = 0) {
    try {
      const files = fs.readdirSync(this.cacheDir).filter((f) => f.endsWith('.json'));
      const threshold = olderThanMs ? Date.now() - olderThanMs : 0;
      let cleared = 0;
      for (const f of files) {
        try {
          const raw = fs.readFileSync(path.join(this.cacheDir, f), 'utf8');
          const entry = JSON.parse(raw);
          if (!olderThanMs || (entry.createdAt && new Date(entry.createdAt).getTime() < threshold)) {
            fs.unlinkSync(path.join(this.cacheDir, f));
            cleared++;
          }
        } catch {}
      }
      return cleared;
    } catch {
      return 0;
    }
  }
}

export const detectionCacheService = new DetectionCacheService();

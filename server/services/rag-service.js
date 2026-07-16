import db from '../database/database.js';

const DEFAULT_COLLECTION = 'project-knowledge';

function id(prefix, idValue) {
  return `${prefix}_${String(idValue || Math.random().toString(36)).slice(0, 8)}`;
}

export function ensureSchema() {
  db.prepare(`CREATE TABLE IF NOT EXISTS rag_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    collection TEXT DEFAULT '${DEFAULT_COLLECTION}',
    title TEXT,
    mime_type TEXT,
    chunk_count INTEGER DEFAULT 0,
    metadata_json TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS rag_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    project_id TEXT,
    collection TEXT DEFAULT '${DEFAULT_COLLECTION}',
    content TEXT,
    embedding_json TEXT,
    token_count INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    metadata_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();

  db.prepare(`CREATE INDEX IF NOT EXISTS idx_rag_chunks_project ON rag_chunks(project_id)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_rag_chunks_doc ON rag_chunks(document_id)`).run();
}

function chunkText(text, maxChars = 800, overlap = 120) {
  const safe = String(text || '').replace(/\s+/g, ' ').trim();
  if (!safe) return [];
  if (safe.length <= maxChars) return [safe];
  const chunks = [];
  let start = 0;
  while (start < safe.length) {
    let end = start + maxChars;
    if (end < safe.length) {
      const space = safe.lastIndexOf(' ', end);
      if (space > start + maxChars * 0.5) end = space;
    }
    const slice = safe.slice(start, end).trim();
    if (slice) chunks.push(slice);
    start = end - overlap;
    if (start < 0) start = 0;
    if (start >= safe.length) break;
  }
  return chunks.slice(0, 64);
}

export async function ingestDocument({ projectId = 'demo', title = '', mimeType = 'text/plain', text = '', metadata = {} }) {
  ensureSchema();
  const documentId = id('rag_doc', `${projectId}_${title}_${Date.now()}`);
  const chunks = chunkText(text);

  db.prepare(`INSERT INTO rag_documents (id, project_id, title, mime_type, chunk_count, metadata_json) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(documentId, String(projectId), String(title), String(mimeType || 'text/plain'), chunks.length, JSON.stringify(metadata || {}));

  const stmt = db.prepare(`INSERT INTO rag_chunks (id, document_id, project_id, collection, content, token_count, position, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = id('rag_chunk', `${documentId}_${i}`);
    stmt.run(chunkId, documentId, String(projectId), DEFAULT_COLLECTION, chunks[i], chunks[i].length, i, JSON.stringify({ documentTitle: title, mimeType }));
  }

  return { documentId, chunkCount: chunks.length, collection: DEFAULT_COLLECTION, projectId: String(projectId) };
}

export async function queryCollection({ projectId = 'demo', query = '', collection = DEFAULT_COLLECTION, maxResults = 6 }) {
  ensureSchema();
  const terms = String(query || '').trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return { query, collection, results: [], count: 0 };

  const rows = db.prepare(`SELECT id, document_id, content, metadata_json, project_id FROM rag_chunks WHERE project_id = ? AND collection = ?`).all(String(projectId), String(collection));

  const scored = rows.map(row => {
    const hay = String(row.content || '').toLowerCase();
    const score = terms.reduce((acc, term) => (hay.includes(term.toLowerCase()) ? acc + 1 : acc), 0);
    return { ...row, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const results = scored.filter(r => r.score > 0).slice(0, Math.min(maxResults, 12));
  return { query, collection, count: results.length, results };
}

export function collectionsForProject(projectId = 'demo') {
  ensureSchema();
  const rows = db.prepare(`SELECT collection, COUNT(1) as chunks, COUNT(DISTINCT document_id) as documents FROM rag_chunks WHERE project_id = ? GROUP BY collection`).all(String(projectId));
  return rows;
}

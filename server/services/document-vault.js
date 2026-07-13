import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database/database.js';

const storageDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'storage');

function safeStat(p) { try { return fs.statSync(p); } catch { return null; } }
function titleFromName(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(proj|cut|designs|brief|lead|elev|dxf|pdf|r\d+|rt)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || name;
}

// Scan storage for every client-facing deliverable and return structured records.
export function scanDocuments() {
  const dirs = [
    { dir: 'proposals', type: 'PDF Brief', kind: 'pdf' },
    { dir: 'uploads', type: 'Generated Pack', kind: 'any' },
    { dir: 'elevations', type: 'Elevation', kind: 'any' },
    { dir: 'gcode', type: 'CNC / Cutlist', kind: 'any' },
    { dir: 'cutlists', type: 'Cutlist', kind: 'any' }
  ];

  // Build client lookup (project -> client name) for nicer titles.
  const clientByProject = {};
  try {
    const leads = db.prepare('SELECT id, name FROM leads').all();
    const projToLead = {};
    for (const l of leads) {
      const projs = db.prepare('SELECT id, name FROM projects WHERE lead_id = ?').all(l.id);
      for (const p of projs) projToLead[p.id] = l.name;
    }
    Object.assign(clientByProject, projToLead);
  } catch (_) {}

  const docs = [];
  for (const { dir, type, kind } of dirs) {
    const full = path.join(storageDir, dir);
    if (!fs.existsSync(full)) continue;
    const files = fs.readdirSync(full).filter(f => {
      const ext = path.extname(f).toLowerCase();
      if (kind === 'pdf') return ext === '.pdf';
      return ['.pdf', '.dxf', '.skp', '.png', '.jpg', '.jpeg'].includes(ext);
    });
    for (const f of files) {
      const fp = path.join(full, f);
      const st = safeStat(fp);
      if (!st || st.isDirectory()) continue;
      const ext = path.extname(f).toLowerCase();
      const isPdf = ext === '.pdf';
      const isDxf = ext === '.dxf';
      // derive project id if embedded in filename (proj_xxx)
      const m = f.match(/proj_[A-Za-z0-9]+/);
      const projectId = m ? m[0] : null;
      const client = projectId && clientByProject[projectId] ? clientByProject[projectId] : (projectId ? projectId : 'Studio');
      docs.push({
        id: `${dir}/${f}`,
        type: isDxf ? 'DXF Drawing' : isPdf ? type : (ext === '.skp' ? 'SketchUp Model' : 'Render / Asset'),
        title: titleFromName(f),
        client,
        projectId,
        file: f,
        dir,
        ext,
        url: `/storage/${dir}/${encodeURIComponent(f)}`,
        size: st.size,
        sizeLabel: st.size > 1048576 ? (st.size / 1048576).toFixed(1) + ' MB' : (st.size / 1024).toFixed(0) + ' KB',
        updated: st.mtime.toISOString(),
        status: 'stored'
      });
    }
  }

  docs.sort((a, b) => (a.updated < b.updated ? 1 : -1));
  const pdfBriefs = docs.filter(d => d.type === 'PDF Brief').length;
  const cutlistPdfs = docs.filter(d => d.type === 'Cutlist' || d.type === 'CNC / Cutlist').length;
  const dxfCount = docs.filter(d => d.ext === '.dxf').length;
  return {
    total: docs.length,
    pdfBriefs,
    cutlistPdfs,
    dxfCount,
    documents: docs
  };
}

export default { scanDocuments };

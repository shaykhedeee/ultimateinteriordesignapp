import fs from 'node:fs';
import path from 'node:path';
import { getDb, rowToJson, storageDir } from './database.js';

export function listStoredDocuments() {
  const db = getDb();
  const projects = new Map(
    db.prepare('SELECT id, payload FROM client_projects').all()
      .map((row) => [row.id, rowToJson(row)])
  );
  const cutlists = new Map(
    db.prepare('SELECT id, project_id, payload FROM cutlist_projects').all()
      .map((row) => [row.id, { projectId: row.project_id, ...rowToJson(row) }])
  );

  const items = [
    ...listProposalDocuments(projects),
    ...listCutlistDocuments(projects, cutlists)
  ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      total: items.length,
      proposalBriefs: items.filter((item) => item.type === 'proposal-brief').length,
      cutlistPdfs: items.filter((item) => item.type === 'cutlist-pdf').length
    },
    items
  };
}

function listProposalDocuments(projects) {
  const folder = path.join(storageDir, 'proposals');
  return listPdfFiles(folder).map((file) => {
    const projectId = file.name.replace(/-brief\.pdf$/i, '').replace(/-proposal\.pdf$/i, '');
    const project = projects.get(projectId);
    return {
      id: `proposal-${file.name}`,
      type: 'proposal-brief',
      label: 'PDF Brief',
      title: `${project?.clientName || projectId || 'Client'} PDF Brief`,
      clientName: project?.clientName || 'Unknown client',
      projectId,
      fileName: file.name,
      url: `/storage/proposals/${encodeURIComponent(file.name)}`,
      size: file.size,
      updatedAt: file.updatedAt,
      createdAt: project?.createdAt || file.updatedAt,
      status: project?.designPackage ? 'Brief package generated' : 'Stored PDF',
      meta: [
        project?.city,
        project?.homeType?.toUpperCase?.(),
        project?.budgetTier,
        project?.selectedSpaces?.length ? `${project.selectedSpaces.length} spaces` : ''
      ].filter(Boolean)
    };
  });
}

function listCutlistDocuments(projects, cutlists) {
  const folder = path.join(storageDir, 'cutlists');
  return listPdfFiles(folder).map((file) => {
    const match = file.name.match(/^(.+?)-r(\d+)\.pdf$/i);
    const cutlistId = match?.[1] || file.name.replace(/\.pdf$/i, '');
    const revision = Number(match?.[2] || 1);
    const cutlist = cutlists.get(cutlistId);
    const project = cutlist?.projectId ? projects.get(cutlist.projectId) : null;
    return {
      id: `cutlist-${file.name}`,
      type: 'cutlist-pdf',
      label: 'Cutlist PDF',
      title: `${cutlist?.clientName || project?.clientName || 'Client'} Cutlist R${revision}`,
      clientName: cutlist?.clientName || project?.clientName || 'Unknown client',
      projectId: cutlist?.projectId || '',
      cutlistId,
      revision,
      fileName: file.name,
      url: `/storage/cutlists/${encodeURIComponent(file.name)}`,
      size: file.size,
      updatedAt: file.updatedAt,
      createdAt: cutlist?.createdAt || file.updatedAt,
      status: `${cutlist?.moduleCount || cutlist?.modules?.length || 0} modules / ${cutlist?.partCount || cutlist?.parts?.length || cutlist?.totals?.partRows || 0} part rows`,
      meta: [
        cutlist?.status,
        cutlist?.totals?.sheetCount ? `${cutlist.totals.sheetCount} sheets` : '',
        cutlist?.totals?.wastePercent != null ? `${cutlist.totals.wastePercent}% waste` : ''
      ].filter(Boolean)
    };
  });
}

function listPdfFiles(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
    .map((entry) => {
      const absolute = path.join(folder, entry.name);
      const stat = fs.statSync(absolute);
      return {
        name: entry.name,
        size: stat.size,
        updatedAt: stat.mtime.toISOString()
      };
    });
}

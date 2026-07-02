const API_BASE = 'http://localhost:5055/api';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let error = text;
    try {
      const parsed = JSON.parse(text);
      error = parsed.error || text;
    } catch {
      // keep raw text
    }
    throw new Error(error);
  }
  return res.json();
}

export async function getProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return handleResponse(res);
}

export async function getProject(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}`);
  return handleResponse(res);
}

export async function getCurrentScene(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/scenes/current`);
  return handleResponse(res);
}

export async function saveScene(projectId: string, scene: any, reason = 'Design edit', branch = 'main') {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene, reason, branch }),
  });
  return handleResponse(res);
}

export async function validateScene(projectId: string, versionId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/scenes/${encodeURIComponent(versionId)}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res);
}

export async function getCAD(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/cad`);
  return handleResponse(res);
}

export async function saveCAD(projectId: string, data: { walls: any[]; openings: any[]; furniture: any[]; rooms: any[]; measures: any[]; pixelsPerMeter?: number }) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/cad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getMaterials(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/materials`);
  return handleResponse(res);
}

export async function saveMaterials(projectId: string, data: { laminates: any[]; hardware: any[]; notes?: string }) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getDrawings(projectId: string, versionId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/scenes/${encodeURIComponent(versionId)}/drawings`);
  return handleResponse(res);
}

export async function getRenders(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/renders`);
  return handleResponse(res);
}

export async function generateRender(projectId: string, formData: FormData) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/renders/generate`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function getLeads() {
  const res = await fetch(`${API_BASE}/leads`);
  return handleResponse(res);
}

export async function closeLead(leadId: string, status: 'human_closed' | 'human_lost') {
  const res = await fetch(`${API_BASE}/leads/${encodeURIComponent(leadId)}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function getCutlist(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/cutlist`);
  return handleResponse(res);
}

export async function calculateCutlist(projectId: string, cabinets: any[], options = {}) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/cutlist/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cabinets, options }),
  });
  return handleResponse(res);
}

export async function getMaterialCatalog() {
  const res = await fetch(`${API_BASE}/material-catalog`);
  return handleResponse(res);
}

export async function getFloorPlanVersions(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/floor-plan-versions`);
  return handleResponse(res);
}

export async function reviewFloorPlanVersion(versionId: string, data: { corrections?: any[]; reviewedSceneData?: any }) {
  const res = await fetch(`${API_BASE}/floor-plan-versions/${encodeURIComponent(versionId)}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

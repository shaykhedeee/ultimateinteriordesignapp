import type { ProjectRecord } from './mock-store';
import { invalidateProjectProposals } from './proposal-stale';

export type StaleReason = 'geometry_changed' | 'material_changed' | 'camera_changed' | 'scene_branched';

export function applyStaleFlags(project: ProjectRecord, reason: StaleReason) {
  project.staleFlags = project.staleFlags ?? { renders: false, drawings: false, pricing: false };

  if (reason === 'geometry_changed' || reason === 'scene_branched') {
    project.staleFlags.renders = true;
    project.staleFlags.drawings = true;
    project.staleFlags.pricing = true;
    invalidateProjectProposals(project.id, reason);
  }

  if (reason === 'material_changed') {
    project.staleFlags.renders = true;
    project.staleFlags.pricing = true;
    invalidateProjectProposals(project.id, reason);
  }

  if (reason === 'camera_changed') {
    project.staleFlags.renders = true;
  }

  return project.staleFlags;
}

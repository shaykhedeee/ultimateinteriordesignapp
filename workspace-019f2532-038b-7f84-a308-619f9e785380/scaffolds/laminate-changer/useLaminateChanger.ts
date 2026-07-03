import { useMemo, useState } from 'react';
import type { LaminateMaterialRef, LaminateSelectionMode, LaminateSurfaceType, SurfaceCandidate } from './types';

export type UseLaminateChangerOptions = {
  organizationId: string;
  projectId: string;
  zoneId?: string;
  renderId: string;
  apiClient: {
    previewLaminatePlan(input: any): Promise<any>;
    createLaminateJob(input: any): Promise<{ jobId: string }>;
  };
};

export function useLaminateChanger(options: UseLaminateChangerOptions) {
  const [selectionMode, setSelectionMode] = useState<LaminateSelectionMode>('auto_detect');
  const [selectedSurface, setSelectedSurface] = useState<SurfaceCandidate | null>(null);
  const [material, setMaterial] = useState<LaminateMaterialRef | null>(null);
  const [surfaceType, setSurfaceType] = useState<LaminateSurfaceType>('unknown');
  const [styleIntent, setStyleIntent] = useState('');
  const [notes, setNotes] = useState('');
  const [preserveHardware, setPreserveHardware] = useState(true);
  const [preview, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canPreview = useMemo(() => !!material, [material]);
  const canSubmit = useMemo(() => !!material && (selectionMode !== 'detected_surface' || !!selectedSurface), [material, selectionMode, selectedSurface]);

  async function generatePreview() {
    if (!material) return;
    setLoadingPreview(true);
    try {
      const result = await options.apiClient.previewLaminatePlan({
        organizationId: options.organizationId,
        projectId: options.projectId,
        zoneId: options.zoneId,
        renderId: options.renderId,
        selectionMode,
        selectedSurfaceId: selectedSurface?.id,
        surfaceType,
        material,
        preserveHardware,
        styleIntent,
        notes,
        requestedBy: 'replace-me-user-id',
      });
      setPreview(result);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function submit() {
    if (!material) throw new Error('Material is required');
    setSubmitting(true);
    try {
      return await options.apiClient.createLaminateJob({
        organizationId: options.organizationId,
        projectId: options.projectId,
        zoneId: options.zoneId,
        renderId: options.renderId,
        selectionMode,
        selectedSurfaceId: selectedSurface?.id,
        surfaceType,
        material,
        preserveHardware,
        styleIntent,
        notes,
        requestedBy: 'replace-me-user-id',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    state: {
      selectionMode,
      selectedSurface,
      material,
      surfaceType,
      styleIntent,
      notes,
      preserveHardware,
      preview,
      loadingPreview,
      submitting,
      canPreview,
      canSubmit,
    },
    actions: {
      setSelectionMode,
      setSelectedSurface,
      setMaterial,
      setSurfaceType,
      setStyleIntent,
      setNotes,
      setPreserveHardware,
      generatePreview,
      submit,
    },
  };
}

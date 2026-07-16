import { createJob } from './job-orchestrator.js';
import { getEdit, updateEditStatus } from './render-edit-service.js';

export async function enqueueEditJob(editId) {
  const edit = getEdit(editId);
  if (!edit) {
    return { ok: false, error: 'Edit not found' };
  }

  if (!edit.providerRouting) {
    return { ok: false, error: 'Provider routing missing for edit request' };
  }

  const job = createJob({
    organizationId: edit.projectId,
    projectId: edit.projectId,
    zoneId: edit.zoneId || null,
    jobType: 'inpaint_render',
    provider: edit.providerRouting.provider || edit.provider || null,
    providerJobId: null,
    inputJson: {
      editId,
      projectId: edit.projectId,
      renderId: edit.renderId,
      editType: edit.editType,
      title: edit.title,
      instruction: edit.instruction,
      maskAssetId: edit.maskAssetId,
      maskBboxJson: edit.maskBboxJson,
      referenceAssetId: edit.referenceAssetId,
      roomStyleContext: edit.roomStyleContext,
      geometryContext: edit.geometryContext,
      preserveCamera: edit.preserveCamera,
      preserveGeometry: edit.preserveGeometry,
      preserveLightingDirection: edit.preserveLightingDirection,
      providerRouting: edit.providerRouting
    }
  });

  const updated = updateEditStatus(editId, {
    status: 'queued',
    stage: 'queued',
    jobId: job.jobId,
    provider: job.job.provider,
    providerRouting: edit.providerRouting
  });

  return { ok: true, jobId: job.jobId, edit: updated };
}

export async function processInpaintRender(job) {
  const raw = job?.data || {};
  const editId = raw.editId || raw.jobId;

  updateEditStatus(editId, {
    status: 'running',
    stage: 'running',
    provider: raw.provider || raw.providerRouting?.provider || null,
    providerRouting: raw.providerRouting || null
  });

  // Placeholder execution path so the worker does not die,
  // while making the run state observable for the app shell.
  return {
    ok: true,
    stage: 'awaiting_provider',
    editId,
    provider: raw.provider || raw.providerRouting?.provider || null,
    inputJson: raw,
    outputJson: {
      state: 'queued_for_provider',
      message: 'Edit job accepted; awaiting provider execution.'
    }
  };
}

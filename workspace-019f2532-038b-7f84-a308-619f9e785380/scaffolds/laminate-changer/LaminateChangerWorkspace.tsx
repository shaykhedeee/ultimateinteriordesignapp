import React from 'react';
import { SurfaceCandidateOverlay } from './SurfaceCandidateOverlay';
import { useLaminateChanger } from './useLaminateChanger';

export type LaminateChangerWorkspaceProps = {
  organizationId: string;
  projectId: string;
  zoneId?: string;
  renderId: string;
  renderImageUrl: string;
  candidateSurfaces?: any[];
  apiClient: {
    previewLaminatePlan(input: any): Promise<any>;
    createLaminateJob(input: any): Promise<{ jobId: string }>;
  };
};

export function LaminateChangerWorkspace(props: LaminateChangerWorkspaceProps) {
  const tool = useLaminateChanger({
    organizationId: props.organizationId,
    projectId: props.projectId,
    zoneId: props.zoneId,
    renderId: props.renderId,
    apiClient: props.apiClient,
  });

  const { state, actions } = tool;

  return (
    <div className="grid min-h-[760px] grid-cols-[1.1fr_420px] gap-6 rounded-[24px] border border-white/10 bg-[#0f1116] p-6 text-white shadow-2xl">
      <section className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#090b10]">
        <img src={props.renderImageUrl} alt="Render" className="h-full w-full object-cover" />
        {!!props.candidateSurfaces?.length && (
          <SurfaceCandidateOverlay
            candidates={props.candidateSurfaces as any}
            selectedSurfaceId={state.selectedSurface?.id}
            onSelect={actions.setSelectedSurface}
          />
        )}
        <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur">
          Laminate Changer Studio
        </div>
      </section>

      <aside className="flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#141821]">
        <header className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-wide">Laminate Changer</h2>
          <p className="mt-1 text-sm text-white/55">
            Replace shutters, panels, and laminates while preserving geometry, hardware, and lighting realism.
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="space-y-3">
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Selection mode</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['auto_detect', 'Auto Detect'],
                ['detected_surface', 'Detected Surface'],
                ['manual_mask', 'Manual Mask'],
                ['lasso', 'Lasso'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => actions.setSelectionMode(value as any)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    state.selectionMode === value
                      ? 'border-violet-400 bg-violet-500/15 text-white'
                      : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Surface type</label>
            <select
              value={state.surfaceType}
              onChange={(e) => actions.setSurfaceType(e.target.value as any)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
            >
              {['unknown', 'wardrobe_shutter', 'cabinet_front', 'tv_panel', 'wall_panel', 'vanity_shutter', 'partition_cladding', 'headboard_panel', 'shelf_panel', 'laminate_floor'].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-3">
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Material reference</label>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <input
                placeholder="Warm Walnut Matte / Beige Ash / Smoked Oak..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                onChange={(e) =>
                  actions.setMaterial({
                    name: e.target.value,
                    finish: 'matte',
                    grainDirection: 'vertical',
                  })
                }
              />
            </div>
          </section>

          <section className="space-y-3">
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Style intent</label>
            <textarea
              value={state.styleIntent}
              onChange={(e) => actions.setStyleIntent(e.target.value)}
              className="min-h-[84px] w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm outline-none placeholder:text-white/30"
              placeholder="Keep the room warm modern and elegant. Avoid high-gloss luxury vibes."
            />
          </section>

          <section className="space-y-3">
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Execution notes</label>
            <textarea
              value={state.notes}
              onChange={(e) => actions.setNotes(e.target.value)}
              className="min-h-[84px] w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm outline-none placeholder:text-white/30"
              placeholder="Keep profile handles unchanged. Preserve mirror reflections. Avoid bleeding onto the side panel."
            />
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/75">Preserve hardware</span>
              <input type="checkbox" checked={state.preserveHardware} onChange={(e) => actions.setPreserveHardware(e.target.checked)} />
            </div>
          </section>

          {!!state.preview && (
            <section className="space-y-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-4">
              <h3 className="text-sm font-medium">AURA Preview Plan</h3>
              <div className="space-y-2 text-sm text-white/70">
                <p><span className="text-white/90">Material:</span> {state.preview.material?.name}</p>
                <p><span className="text-white/90">Warnings:</span></p>
                <ul className="list-disc space-y-1 pl-5">
                  {(state.preview.suggestedWarnings ?? []).map((warning: string) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        <footer className="grid gap-3 border-t border-white/10 p-5">
          <button
            type="button"
            disabled={!state.canPreview || state.loadingPreview}
            onClick={actions.generatePreview}
            className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            {state.loadingPreview ? 'Generating Preview…' : 'Preview Edit Plan'}
          </button>
          <button
            type="button"
            disabled={!state.canSubmit || state.submitting}
            onClick={() => void actions.submit()}
            className="rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(139,92,246,0.35)] disabled:opacity-40"
          >
            {state.submitting ? 'Queueing…' : 'Apply Laminate Change'}
          </button>
        </footer>
      </aside>
    </div>
  );
}

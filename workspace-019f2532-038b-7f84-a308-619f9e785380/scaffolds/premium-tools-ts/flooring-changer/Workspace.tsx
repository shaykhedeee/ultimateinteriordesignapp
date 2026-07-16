import React, { useState } from 'react';
import type { FlooringChangerRequest } from './types';

export type FlooringChangerWorkspaceProps = {
  organizationId: string;
  projectId: string;
  zoneId?: string;
  renderId: string;
  renderImageUrl: string;
  onPreview?(payload: Partial<FlooringChangerRequest>): Promise<void>;
  onSubmit?(payload: Partial<FlooringChangerRequest>): Promise<void>;
};

export function FlooringChangerWorkspace(props: FlooringChangerWorkspaceProps) {
  const [styleIntent, setStyleIntent] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="grid min-h-[760px] grid-cols-[1.1fr_420px] gap-6 rounded-[24px] border border-white/10 bg-[#0f1116] p-6 text-white shadow-2xl">
      <section className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#090b10]">
        <img src={props.renderImageUrl} alt="Preview" className="h-full w-full object-cover" />
        <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur">
          Flooring Changer
        </div>
      </section>

      <aside className="flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#141821]">
        <header className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-wide">Flooring Changer</h2>
          <p className="mt-1 text-sm text-white/55">
            Premium workspace scaffold for flooring-changer. Controls: Flooring family, plank direction, tile size, grout color, skirting protection.
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Planner focus</div>
            <p className="mt-2">perspective continuity, plank/tile scale, furniture grounding, and room brightness impact.</p>
          </section>

          <section className="space-y-3">
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Style intent</label>
            <textarea
              value={styleIntent}
              onChange={(e) => setStyleIntent(e.target.value)}
              className="min-h-[84px] w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm outline-none placeholder:text-white/30"
              placeholder="Describe the target look and what must remain unchanged."
            />
          </section>

          <section className="space-y-3">
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Execution notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[84px] w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm outline-none placeholder:text-white/30"
              placeholder="Add preserve rules, constraints, or review notes."
            />
          </section>
        </div>

        <footer className="grid gap-3 border-t border-white/10 p-5">
          <button
            type="button"
            onClick={() => props.onPreview?.({ styleIntent, notes })}
            className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white"
          >
            Preview Plan
          </button>
          <button
            type="button"
            onClick={() => props.onSubmit?.({ styleIntent, notes })}
            className="rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(139,92,246,0.35)]"
          >
            Apply Change
          </button>
        </footer>
      </aside>
    </div>
  );
}

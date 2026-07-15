import React from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, CircleDot, ArrowRight } from 'lucide-react';

/**
 * WorkflowStatusBar — shared, rule-compliant status band.
 *
 * Honors docs/UI_UX_RULES.md:
 *  - "Show the current stage, the next required action, and the output that will be produced."
 *  - "Make stage completion visible."
 *  - Renders / Elevations / Materials / Finance all use this so they feel like one product.
 *
 * Honors docs/RENDER_AND_ELEVATION_ARCHITECTURE.md:
 *  - surfaces what is approved, what is stale, and what needs designer review.
 *
 * Props:
 *  stageLabel      current production stage (e.g. "Render Studio")
 *  nextAction      the next required action for the designer
 *  outputLabel     the artifact this screen produces (e.g. "Final render + prompt + mask")
 *  stageComplete   boolean — has this stage's prerequisites been met
 *  stale           boolean|number — is the derived output out of date vs the scene graph
 *  approvedCount   number of approved items
 *  needsReview     number of items needing revision / unreviewed
 *  onRegenerate    handler to re-derive stale outputs from the scene graph
 *  onOpenStage     optional handler to jump to the next stage
 */
export default function WorkflowStatusBar({
  stageLabel = 'Workspace',
  nextAction,
  outputLabel,
  stageComplete = true,
  stale = 0,
  approvedCount = 0,
  needsReview = 0,
  onRegenerate,
  onOpenStage,
}) {
  const isStale = Number(stale) === 1;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
      {/* Stage + completion */}
      <div className="flex items-center gap-2 min-w-0">
        {stageComplete ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <CircleDot className="w-4 h-4 text-[var(--gold)] shrink-0" />
        )}
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 leading-none">Active Stage</div>
          <div className="text-sm font-extrabold text-slate-100 leading-tight truncate">{stageLabel}</div>
        </div>
      </div>

      <div className="w-px h-8 bg-slate-800 hidden sm:block" />

      {/* Next action */}
      {nextAction && (
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <ArrowRight className="w-4 h-4 text-[var(--gold)] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 leading-none">Next Action</div>
            <div className="text-slate-200 leading-tight truncate">{nextAction}</div>
          </div>
        </div>
      )}

      {/* Output produced */}
      {outputLabel && (
        <div className="hidden md:flex items-start gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 leading-none">Produces</div>
            <div className="text-slate-400 leading-tight truncate">{outputLabel}</div>
          </div>
        </div>
      )}

      <div className="w-px h-8 bg-slate-800 hidden lg:block" />

      {/* Approved / Needs review chips */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
          <CheckCircle2 className="w-3 h-3" /> {approvedCount} approved
        </span>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${
          needsReview > 0
            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            : 'bg-slate-500/10 text-slate-500 border-slate-700'
        }`}>
          <AlertTriangle className="w-3 h-3" /> {needsReview} review
        </span>
      </div>

      {/* Stale alert */}
      {isStale && (
        <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto bg-amber-950/30 border border-amber-900/40 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
            Out-of-date: underlying design changed — outputs may not match the scene graph.
          </span>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="bg-[var(--gold)] hover:bg-[#c49e2f] text-slate-950 px-3 py-1 rounded-lg font-black uppercase text-[10px] transition flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

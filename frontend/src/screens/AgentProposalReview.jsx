import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldX, PencilLine, ArrowLeft, Sparkles, FileText, LayoutList, ClipboardList, Ruler } from 'lucide-react';

const RISK_COLOR = {
  low: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  medium: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  high: 'text-red-300 border-red-500/40 bg-red-500/10',
};

const STATUS_COLOR = {
  pending: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  approved: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  rejected: 'text-red-300 border-red-500/40 bg-red-500/10',
  modified: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
};

const AGENT_META = {
  agent_floor_plan_review: { label: 'Floor Plan Review', icon: FileText },
  agent_layout_assist: { label: 'Layout Assist', icon: LayoutList },
  agent_materials_style: { label: 'Materials + Style', icon: Palette },
  agent_budget_optimization: { label: 'Budget Optimization', icon: IndianRupee },
  agent_render_recommendation: { label: 'Render Recommendation', icon: Sparkles },
  agent_documentation: { label: 'Documentation', icon: ClipboardList },
  agent_product_configuration: { label: 'Product Configuration', icon: Ruler },
};

const INPUT_LABEL = {
  user_edited: 'User edited',
  ai_previous: 'Previous AI result',
  initial_scan: 'Initial scan',
};

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
  return res.json();
}

function fmt(n) {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0)); } catch (e) { return `₹${Number(n || 0)}`; }
}

function FeedbackHistory({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiGet(`/api/agents/proposals/${projectId}/feedback`);
      setItems(Array.isArray(data?.feedback) ? data.feedback : []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [projectId]);

  return (
    <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold text-slate-200">Feedback History</div>
          <div className="text-[10px] text-slate-500">Active learning loop: every reject/modify decision is logged here for future prompt calibration.</div>
        </div>
        <button onClick={load} className="px-2.5 py-1.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-lg text-[10px] font-black uppercase">Refresh</button>
      </div>
      {error && <div className="text-[10px] text-red-300 font-mono" role="alert" aria-live="polite">{error}</div>}
      {loading && <div className="text-[10px] text-slate-400">Loading feedback...</div>}
      {!loading && items.length === 0 && <div className="text-[10px] text-slate-500">No feedback yet. Review a proposal to start active learning.</div>}
      <div className="space-y-2">
        {items.map((fb) => (
          <div key={fb.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[10px] text-slate-300 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-slate-200">{fb.proposalId}</div>
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase ${STATUS_COLOR[fb.decision] || STATUS_COLOR.pending}`}>{fb.decision}</span>
            </div>
            <div>{fb.proposedBy} · {fb.proposalType} · {new Date(fb.createdAt).toLocaleString('en-IN')}</div>
            {fb.rejectionFeedback && <div><span className="text-slate-500">Feedback:</span> {fb.rejectionFeedback}</div>}
            {Array.isArray(fb.modificationNotes) && fb.modificationNotes.length > 0 && (
              <div><span className="text-slate-500">Notes:</span> {fb.modificationNotes.join('; ')}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentProposalReview({ projectId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [modNotes, setModNotes] = useState({});
  const [notesDraft, setNotesDraft] = useState('');

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiGet(`/api/agents/proposals/${projectId}`);
      setProposals(Array.isArray(data?.proposals) ? data.proposals : []);
      setSelectedId((prev) => {
        if (!prev) return null;
        const exists = (data?.proposals || []).some((p) => p.id === prev);
        return exists ? prev : null;
      });
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [projectId]);

  const submitReview = async (proposal, decision) => {
    setReviewingId(proposal.id);
    try {
      const fb = feedback[proposal.id] || '';
      const notes = modNotes[proposal.id] || notesDraft;
      if (decision === 'reject' && !fb.trim()) {
        setError('Rejection feedback is required.');
        setReviewingId(null);
        return;
      }
      const payload = {
        decision,
        userId: 'local-user',
        rejectionFeedback: fb || null,
        modificationNotes: notes ? String(notes).split('\n').filter(Boolean) : null,
      };
      await apiPost(`/api/agents/proposals/${proposal.id}/review`, payload);
      setFeedback((s) => ({ ...s, [proposal.id]: '' }));
      setModNotes((s) => ({ ...s, [proposal.id]: '' }));
      setNotesDraft('');
      await load();
    } catch (e) { setError(e.message); } finally { setReviewingId(null); }
  };

  const pendingCount = useMemo(() => proposals.filter((p) => p.reviewStatus === 'pending').length, [proposals]);
  const selected = useMemo(() => proposals.find((p) => p.id === selectedId) || null, [proposals, selectedId]);

  const reviewedCount = useMemo(() => proposals.filter((p) => p.reviewStatus !== 'pending').length, [proposals]);

  return (
    <div className="h-full w-full overflow-y-auto text-left space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Agent Proposals</h3>
          <p className="text-[10px] text-slate-500">Phase 2N approval gate — review patch proposals before any geometry changes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-lg text-[10px] font-black uppercase">Refresh</button>
          <button onClick={onBack} className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-2"><ArrowLeft className="w-3.5 h-3.5" />Back</button>
          {projectId && (
            <button
              onClick={async () => {
                setError('');
                try {
                  const res = await fetch(`http://127.0.0.1:5055/api/agents/proposals/demo-seed`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId }),
                  });
                  if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
                  await load();
                } catch (e) { setError(e.message); }
              }}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 rounded-lg text-[10px] font-black uppercase"
            >
              Seed Demo Proposal
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-[10px] text-red-300 font-mono" role="alert" aria-live="polite">{error}</div>}

      <FeedbackHistory projectId={projectId} />

      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] font-black uppercase text-slate-400">
          Pending <span className="ml-2 text-slate-200">{pendingCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] font-black uppercase text-slate-400">
          Reviewed <span className="ml-2 text-slate-200">{reviewedCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] font-black uppercase text-slate-400">
          Total <span className="ml-2 text-slate-200">{proposals.length}</span>
        </div>
      </div>

      {loading && <div className="text-[10px] text-slate-400">Loading proposals...</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Proposal List */}
        <div className="space-y-3">
          {proposals.length === 0 && !loading && (
            <div className="text-[11px] text-slate-500">No proposals yet. Seed a demo proposal to inspect the approval flow.</div>
          )}
          {(proposals || []).map((p) => {
            const AgentIcon = AGENT_META[p.proposedBy]?.icon || ShieldCheck;
            const agentLabel = AGENT_META[p.proposedBy]?.label || p.proposedBy;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left rounded-2xl border p-4 space-y-2 transition ${selectedId === p.id ? 'border-[#D4AF37]/60 bg-[#D4AF37]/[0.06]' : 'border-slate-850 bg-slate-900/40 hover:border-slate-800'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-[#D4AF37]"><AgentIcon className="w-4 h-4" /></span>
                    <div>
                      <div className="text-[11px] font-bold text-slate-200">{p.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{agentLabel} · {p.proposalType}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-md border text-[10px] font-black uppercase ${STATUS_COLOR[p.reviewStatus] || STATUS_COLOR.pending}`} aria-label={`Review status: ${p.reviewStatus}`}>
                    {p.reviewStatus}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-1">
                  <div>Target: <span className="text-slate-200">{p.targetEntity?.type}</span> / <span className="text-slate-200">{p.targetEntity?.id}</span></div>
                  <div>Risk: <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black ${RISK_COLOR[p.impactAssessment?.riskLevel] || RISK_COLOR.low}`}>{p.impactAssessment?.riskLevel || 'low'}</span></div>
                  <div>Confidence: <span className="text-slate-200">{Number(p.rationale?.confidenceScore).toFixed(2)}</span></div>
                  {(p.inputContextReference?.detectedFrom) && (
                    <div>Detected from: <span className="text-slate-200">{INPUT_LABEL[p.inputContextReference.detectedFrom] || p.inputContextReference.detectedFrom}</span></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="space-y-3">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-6 text-[10px] text-slate-500">
              Select a proposal to inspect its patch changes, rationale, and review workflow.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-200">{selected.id}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{AGENT_META[selected.proposedBy]?.label || selected.proposedBy} · {selected.proposalType}</div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-md border text-[10px] font-black uppercase ${STATUS_COLOR[selected.reviewStatus] || STATUS_COLOR.pending}`}>{selected.reviewStatus}</span>
                </div>
              </div>

              <div className="space-y-1 text-[10px] text-slate-400">
                <div><span className="text-slate-500">Target:</span> <span className="text-slate-200">{selected.targetEntity?.type}</span> / <span className="text-slate-200">{selected.targetEntity?.id}</span></div>
                <div><span className="text-slate-500">Rationale:</span> <span className="text-slate-200">{selected.rationale?.primaryReason}</span></div>
                {Array.isArray(selected.rationale?.supportingEvidence) && selected.rationale.supportingEvidence.length > 0 && (
                  <div><span className="text-slate-500">Evidence:</span> {selected.rationale.supportingEvidence.join(', ')}</div>
                )}
                <div><span className="text-slate-500">Confidence:</span> <span className="text-slate-200">{Number(selected.rationale?.confidenceScore).toFixed(2)}</span></div>
                <div><span className="text-slate-500">Risk:</span> <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black ${RISK_COLOR[selected.impactAssessment?.riskLevel] || RISK_COLOR.low}`}>{selected.impactAssessment?.riskLevel || 'low'}</span></div>
                {selected.impactAssessment?.estimatedImpact && (
                  <div><span className="text-slate-500">Impact:</span> <span className="text-slate-200">{selected.impactAssessment.estimatedImpact}</span></div>
                )}
                {selected.inputContextReference?.sceneVersion && (
                  <div><span className="text-slate-500">Scene Version:</span> <span className="text-slate-200">{selected.inputContextReference.sceneVersion}</span></div>
                )}
                {(selected.inputContextReference?.sourceAgentPrompt) && (
                  <div><span className="text-slate-500">Prompt source:</span> <span className="text-slate-200">{selected.inputContextReference.sourceAgentPrompt}</span></div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Patch Changes</div>
                {(selected.changes || []).length === 0 && <div className="text-[10px] text-slate-500">No atomic changes recorded.</div>}
                {(selected.changes || []).map((ch, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1 text-[10px] text-slate-300">
                    <div>{String(ch.operation || 'update').toUpperCase()} → <span className="text-slate-100">{String(ch.targetField || 'unknown')}</span></div>
                    {ch.oldValue != null && <div><span className="text-slate-500">OLD:</span> <span className="font-mono">{JSON.stringify(ch.oldValue)}</span></div>}
                    {ch.newValue != null && <div><span className="text-emerald-300">NEW:</span> <span className="font-mono">{JSON.stringify(ch.newValue)}</span></div>}
                    {(ch.constraints || []).length > 0 && (
                      <div><span className="text-slate-500">CONSTRAINTS:</span> {ch.constraints.map((c, i) => <span key={i} className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 mr-1">{c.ruleName || c.type}</span>)}</div>
                    )}
                  </div>
                ))}
              </div>

              {selected.reviewStatus === 'pending' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Feedback for learning loop (required on reject)</label>
                    <textarea
                      aria-label="Rejection feedback"
                      value={feedback[selected.id] || ''}
                      onChange={(e) => setFeedback((s) => ({ ...s, [selected.id]: e.target.value }))}
                      placeholder="Rejection feedback helps improve future proposals."
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Modification notes (one per line, optional)</label>
                    <textarea
                      aria-label="Modification notes"
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Required changes before approval..."
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button disabled={reviewingId === selected.id} onClick={() => submitReview(selected, 'approve')} className="py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/30 text-[10px] font-black uppercase">Approve</button>
                    <button disabled={reviewingId === selected.id} onClick={() => submitReview(selected, 'reject')} className="py-2 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 hover:bg-red-500/20 text-[10px] font-black uppercase">Reject</button>
                    <button disabled={reviewingId === selected.id} onClick={() => submitReview(selected, 'modify')} className="py-2 rounded-xl bg-sky-500/10 border border-sky-500/40 text-sky-200 hover:bg-sky-500/20 text-[10px] font-black uppercase">Modify</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

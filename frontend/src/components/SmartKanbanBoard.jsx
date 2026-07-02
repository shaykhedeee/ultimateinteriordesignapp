import React, { useMemo, useState } from 'react';
import { KanbanSquare, MoreHorizontal, PlusCircle } from 'lucide-react';

const STAGES = [
  { id: 'new', label: 'New Lead', color: 'border-slate-700 bg-slate-900/40' },
  { id: 'qualified', label: 'Qualified', color: 'border-indigo-500/40 bg-indigo-500/10' },
  { id: 'brief', label: 'Brief', color: 'border-amber-500/40 bg-amber-500/10' },
  { id: 'design', label: 'Design', color: 'border-[#D4AF37]/40 bg-[#D4AF37]/10' },
  { id: 'render', label: 'Render', color: 'border-emerald-500/40 bg-emerald-500/10' },
  { id: 'approval', label: 'Approval', color: 'border-sky-500/40 bg-sky-500/10' },
  { id: 'production', label: 'Production', color: 'border-rose-500/40 bg-rose-500/10' },
];

export default function SmartKanbanBoard({ projects, onOpenProject }) {
  const [filter, setFilter] = useState('all');

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.id, []]));
    (projects || []).forEach((p) => {
      const status = p.status || 'new';
      if (filter !== 'all' && status !== filter) return;
      if (!map[status]) map[status] = [];
      map[status].push(p);
    });
    return map;
  }, [projects, filter]);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Smart Project Board</h3>
          <p className="text-[10px] text-slate-500">Workflow-aware pipeline view with quick actions per stage.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 px-2 py-1.5">
          <option value="all">All Stages</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage.id} className={`min-w-[220px] max-w-[260px] flex-1 rounded-2xl border ${stage.color} p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{stage.label}</span>
              <span className="text-[10px] font-mono text-slate-500">{grouped[stage.id]?.length ?? 0}</span>
            </div>

            <div className="space-y-2">
              {(grouped[stage.id] || []).map((p) => (
                <div key={p.id} onClick={() => onOpenProject?.(p.id)} className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 cursor-pointer hover:border-[#D4AF37]/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200 truncate max-w-[140px]">{p.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); alert('More options'); }} className="text-slate-600 hover:text-slate-300"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">Client: {p.client_name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] font-mono text-slate-400">₹{p.budget ? `${(p.budget / 100000).toFixed(1)}L` : '0L'}</span>
                    <button onClick={(e) => { e.stopPropagation(); onOpenProject?.(p.id); }} className="text-[9px] font-black uppercase text-[#D4AF37] hover:text-[#e6c045] flex items-center gap-1"><PlusCircle className="w-3 h-3" />Open</button>
                  </div>
                </div>
              ))}
          {grouped[stage.id]?.length === 0 && (
            <div className="text-[10px] text-slate-600 italic" aria-label="No items in this stage">No items</div>
          )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

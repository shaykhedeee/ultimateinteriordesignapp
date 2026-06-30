import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, Compass, DollarSign, Lock, FileText, CheckCircle2, 
  Settings, ShoppingBag, PlusCircle, RefreshCw
} from 'lucide-react';

export default function TimelineScreen({ projectId }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchTimeline();
    }
  }, [projectId]);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/timeline`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventMeta = (type) => {
    switch (type) {
      case 'project.created':
        return { icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-slate-800 text-slate-400 border-slate-700' };
      case 'scene.saved':
        return { icon: <Compass className="w-3.5 h-3.5" />, color: 'bg-blue-950 text-blue-400 border-blue-900/60' };
      case 'scene.locked':
        return { icon: <Lock className="w-3.5 h-3.5" />, color: 'bg-amber-950 text-amber-400 border-amber-900/60' };
      case 'budget.profile.created':
        return { icon: <Settings className="w-3.5 h-3.5" />, color: 'bg-teal-950 text-teal-400 border-teal-900/60' };
      case 'estimate.created':
      case 'invoice.created':
        return { icon: <DollarSign className="w-3.5 h-3.5" />, color: 'bg-purple-950 text-purple-400 border-purple-900/60' };
      case 'payment.recorded':
        return { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-emerald-950 text-emerald-400 border-emerald-900/60' };
      case 'variation.approved':
        return { icon: <PlusCircle className="w-3.5 h-3.5" />, color: 'bg-rose-950 text-rose-400 border-rose-900/60' };
      case 'po.issued':
        return { icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-cyan-950 text-cyan-400 border-cyan-900/60' };
      case 'job.started':
      case 'job.succeeded':
        return { icon: <Activity className="w-3.5 h-3.5" />, color: 'bg-sky-950 text-sky-400 border-sky-900/60' };
      default:
        return { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-slate-900 text-slate-500 border-slate-800' };
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-100 tracking-wide">Project Event Timeline</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Chronological audit stream of project edits, saves, billing milestones, and rendering runs</p>
        </div>
        <button
          onClick={fetchTimeline}
          className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sync Log
        </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-1 pb-16 max-w-4xl mx-auto w-full">
        {events.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs mt-6">
            No auditable events logged for this project yet. Edit or save the design to log activities.
          </div>
        ) : (
          <div className="relative border-l border-slate-800 ml-4 pl-8 py-4 space-y-8">
            {events.map((e, idx) => {
              const meta = getEventMeta(e.eventType);
              return (
                <div key={e.id} className="relative slide-up">
                  {/* Timeline node */}
                  <span className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full flex items-center justify-center border font-bold ${meta.color} shadow-lg`}>
                    {meta.icon}
                  </span>
                  
                  {/* Event Details Card */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <strong className="text-slate-200 text-xs font-bold leading-tight">{e.title}</strong>
                        <span className="text-[9px] bg-slate-950/60 border border-slate-850 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider ml-2.5 font-mono">
                          {e.eventType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(e.created_at || e.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {new Date(e.created_at || e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    {e.detail && (
                      <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed bg-slate-950/20 p-2 rounded-lg border border-slate-850/40">
                        {e.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

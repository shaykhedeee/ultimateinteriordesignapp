import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { 
  Activity, Play, CheckCircle2, XCircle, RefreshCw, 
  Clock, Database, Sparkles, Layers, FileText
} from 'lucide-react';

export default function JobsScreen({ projectId }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeJobType, setActiveJobType] = useState('render_generation');

  useEffect(() => {
    if (projectId) {
      fetchJobs();
      
      // Setup periodic polling to watch background job execution progress
      const timer = setInterval(() => {
        fetchJobs();
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [projectId]);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`getApiBase()/projects/${projectId}/jobs`);
      const data = await res.json();
      setJobs(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchJob = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`getApiBase()/projects/${projectId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: activeJobType,
          sourceEntityType: 'manual_trigger',
          sourceEntityId: 'ui_dashboard'
        })
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getJobStatusClass = (status) => {
    switch (status) {
      case 'succeeded':
        return 'text-emerald-400 border-emerald-950/60 bg-emerald-950/20';
      case 'failed':
        return 'text-red-400 border-red-950/60 bg-red-950/20';
      case 'running':
        return 'text-sky-400 border-sky-950/60 bg-sky-950/20';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      
      {/* Header and trigger */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-100 tracking-wide">Background Jobs Monitor</h2>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Monitor background rendering pipelines, DXF vector drafting, and panel layout nestings</p>
        </div>

        <div className="flex gap-2.5">
          <select
            value={activeJobType}
            onChange={e => setActiveJobType(e.target.value)}
            className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-350 outline-none focus:border-[#D4AF37]/50 cursor-pointer"
          >
            <option value="render_generation">3D AI Render Rebuild</option>
            <option value="drawing_generation">2D/3D CAD Drawing Pack</option>
            <option value="pricing_generation">Quotation BOQ Audit</option>
          </select>
          <button
            onClick={handleLaunchJob}
            disabled={isLoading}
            className="bg-[#D4AF37] hover:bg-[#c49e2f] text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" /> Spawn Job
          </button>
        </div>
      </div>

      {/* Jobs Stack List */}
      <div className="flex-grow overflow-y-auto pr-1 pb-16 max-w-4xl w-full mx-auto">
        {jobs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs mt-6">
            No background execution logs saved yet. Dispatch a task above to generate background render jobs, CAD drafting jobs, or quotation audits.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-700 transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-slate-950 rounded-xl text-[#D4AF37] border border-slate-850">
                      {(job.jobType || job.job_type) === 'render_generation' ? <Sparkles className="w-4 h-4" /> :
                       (job.jobType || job.job_type) === 'drawing_generation' ? <Layers className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </span>
                    <div>
                      <strong className="text-slate-200 text-xs block leading-tight font-black uppercase tracking-wider">{(job.jobType || job.job_type || '').replace('_', ' ')}</strong>
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">Job ID: {job.id}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded-full ${getJobStatusClass(job.status)}`}>
                      {job.status}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono mt-1.5">{new Date(job.created_at || job.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>Task Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        job.status === 'succeeded' ? 'bg-emerald-400' :
                        job.status === 'failed' ? 'bg-red-500' : 'bg-[#D4AF37]'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

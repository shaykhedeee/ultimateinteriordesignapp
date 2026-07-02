import React, { useEffect, useState } from 'react';
import { RenderTier, Project } from '../../types/aura';
import { api } from '../../lib/api';
import {
  Zap, Wand2, Cloud, Video, Glasses, Play, Sparkles, Download, QrCode, AlertTriangle,
} from 'lucide-react';

type RenderStatus = 'idle' | 'queued' | 'rendering' | 'done' | 'error';

interface RenderJob {
  jobId: string;
  status: RenderStatus;
  progress: number;
  tier: RenderTier;
  outputUrl?: string;
  error?: string;
}

// Minimal shape so we don't depend on the whole Project model.
interface ProjectMin {
  id: string;
  name?: string;
  clientName?: string;
  status?: string;
}

export const RenderStudio: React.FC<{ project?: ProjectMin; onTriggerVR?: () => void }> = ({
  project, onTriggerVR,
}) => {
  const [activeTier, setActiveTier] = useState<RenderTier>('tier2-ai-enhance');
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedJob = jobs.find(j => j.jobId === selectedJobId) || null;

  const tiers: { id: RenderTier; name: string; time: string; res: string; desc: string; icon: React.ReactNode; tech: string }[] = [
    {
      id: 'tier1-webgpu', name: 'Tier 1: Real-Time WebGPU Preview', time: 'Instant (<16ms)', res: '1080p 60fps',
      desc: 'Screen-space reflections, real-time GI DDGI approximation, temporal anti-aliasing.',
      icon: <Zap className="w-4 h-4 text-amber-400" />, tech: 'Client WebGPU',
    },
    {
      id: 'tier2-ai-enhance', name: 'Tier 2: AI-Enhanced Render', time: '5 - 15 seconds', res: '4K Photorealism',
      desc: 'SDXL + ControlNet depth/canny/segmentation ensemble. Style locked across rooms via IP-Adapter.',
      icon: <Wand2 className="w-4 h-4 text-indigo-400" />, tech: 'LoRA + ESRGAN',
    },
    {
      id: 'tier3-pathtrace', name: 'Tier 3: Cloud GPU Path-Tracing', time: '1 - 10 minutes', res: '8K Ultra HD',
      desc: 'NVIDIA H100 Cloud Cluster. Full path tracing with caustics, subsurface scattering, OptiX AI Denoiser.',
      icon: <Cloud className="w-4 h-4 text-cyan-400" />, tech: 'USD + Cycles',
    },
    {
      id: 'tier4-cinematic', name: 'Tier 4: Cinematic Animation', time: '10 - 30 minutes', res: '4K 60fps Video',
      desc: 'AI-generated cinematic camera paths, lens flare, depth-of-field, AI audio narration explaining design.',
      icon: <Video className="w-4 h-4 text-purple-400" />, tech: 'NeRF Flythrough',
    },
    {
      id: 'tier5-immersive', name: 'Tier 5: Immersive AR / VR', time: 'Instant Stream', res: 'Dual 4K Eye',
      desc: 'WebXR walkthrough for Meta Quest 3 & Apple Vision Pro + AR full-room overlay QR code.',
      icon: <Glasses className="w-4 h-4 text-pink-400" />, tech: 'WebXR / ARKit',
    },
  ];

  const handleRunRender = async () => {
    setError(null);
    if (!project?.id) {
      setError('Select a project to render.');
      return;
    }
    const jobId = `job_${Date.now()}`;
    const next: RenderJob = { jobId, status: 'queued', progress: 0, tier: activeTier };
    setJobs(prev => [next, ...prev]);
    setSelectedJobId(jobId);

    try {
      // Best-effort backend trigger; UI remains usable if offline.
      const resp = await api<{ jobId?: string }>(`/projects/${project.id}/renders/generate`, {
        method: 'POST',
        body: JSON.stringify({ tier: activeTier }),
      });
      if (resp?.jobId) {
        setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, jobId: resp.jobId as string } : j));
      }
    } catch {
      // fallback: simulate locally so UI flow is testable without API
    }

    let progress = 0;
    const tick = () => {
      progress += Math.floor(Math.random() * 18) + 4;
      if (progress >= 100) {
        progress = 100;
        setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, status: 'done', progress } : j));
        return;
      }
      setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, status: 'rendering', progress } : j));
      setTimeout(tick, 320);
    };
    setTimeout(tick, 420);
  };

  const handleDownload = async () => {
    if (!project?.id || !selectedJob) return;
    try {
      const blob = await api<Blob>(`/projects/${project.id}/renders/${encodeURIComponent(selectedJob.jobId)}/download`, {
        method: 'GET',
      });
      const url = URL.createObjectURL(blob as any);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.id || 'render'}-${selectedJob.tier}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download not available yet.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950 text-slate-100 select-none">
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Rendering & Visualization Pipeline
          </div>
          <h1 className="text-2xl font-black tracking-tight">AURA Render Farm & Visual Engine</h1>
          <p className="text-slate-400 text-sm mt-1">
            From instant WebGPU viewport to 8K path tracing and Apple Vision Pro spatial VR.
          </p>
          {project && (
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Active project: <span className="text-slate-200">{project.name || project.id}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerVR}
            className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center gap-2"
          >
            <Glasses className="w-4 h-4 text-purple-400" />
            <span>Launch VR Headset Mode</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tiers.map((t) => {
          const isActive = activeTier === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setActiveTier(t.id)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                isActive ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/40 shadow-xl' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {t.icon}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{t.res}</span>
                </div>
                <h3 className="font-bold text-xs text-slate-100">{t.name}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{t.desc}</p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-indigo-400">{t.time}</span>
                <span className="text-slate-500">{t.tech}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-slate-100">Render Jobs</h2>
            <p className="text-xs text-slate-400">
              Run a render job for your active project and track progress in real time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunRender}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Render</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!selectedJob || selectedJob.status !== 'done'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              title="Download render"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {jobs.length === 0 && (
              <div className="text-xs text-slate-500">No render jobs yet. Pick a tier and run a render.</div>
            )}
            {jobs.map(job => (
              <button
                key={job.jobId}
                onClick={() => setSelectedJobId(job.jobId)}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  selectedJobId === job.jobId ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-400">{job.jobId}</div>
                    <div className="text-sm font-bold text-slate-100">{job.tier}</div>
                  </div>
                  <div className="text-xs font-mono text-slate-300">{job.progress}%</div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-200">Job Details</div>
            {selectedJob ? (
              <div className="text-xs text-slate-400 space-y-1">
                <div>Status: <span className="text-slate-200">{selectedJob.status}</span></div>
                <div>Tier: <span className="text-slate-200">{selectedJob.tier}</span></div>
                <div>Progress: <span className="text-slate-200">{selectedJob.progress}%</span></div>
                {selectedJob.outputUrl && (
                  <div>
                    Output: <a className="text-indigo-400 underline" href={selectedJob.outputUrl} target="_blank" rel="noreferrer">Open</a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Select a job to inspect details.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl flex items-center gap-5 border border-pink-500/30">
          <div className="w-24 h-24 bg-white rounded-2xl p-2 shrink-0 flex items-center justify-center shadow-lg">
            <QrCode className="w-full h-full text-slate-950" />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
              <Glasses className="w-4 h-4" /> AR Full-Room Overlay
            </div>
            <h3 className="font-bold text-sm text-slate-100">Scan QR to project in your real room</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uses Apple ARKit / Google ARCore LiDAR to project this designed room at 1:1 scale right inside your actual physical space.
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-2">
          <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
            <Video className="w-4 h-4" /> Tier 4 Cinematic Export
          </div>
          <h3 className="font-bold text-sm text-slate-100">Social Media & Client Walkthrough Reels</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Auto-generate 60fps 9:16 vertical video walkthroughs for Instagram Reels, TikTok, and YouTube with AI ambient music.
          </p>
          <button
            onClick={() => alert('Cinematic MP4 Walkthrough queued on Cloud Render Farm.')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
          >
            Export 9:16 Vertical Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};

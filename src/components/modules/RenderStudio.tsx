import React, { useState } from 'react';
import { RenderTier } from '../../types/aura';
import { 
  Zap, 
  Wand2, 
  Cloud, 
  Video, 
  Glasses, 
  Play, 
  Sparkles,
  Download,
  QrCode
} from 'lucide-react';

export const RenderStudio: React.FC<{ onTriggerVR: () => void }> = ({ onTriggerVR }) => {
  const [activeTier, setActiveTier] = useState<RenderTier>('tier2-ai-enhance');
  const [sliderPos, setSliderPos] = useState(50); // for Before/After comparison
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const tiers: { id: RenderTier; name: string; time: string; res: string; desc: string; icon: React.ReactNode; tech: string }[] = [
    {
      id: 'tier1-webgpu',
      name: 'Tier 1: Real-Time WebGPU Preview',
      time: 'Instant (<16ms)',
      res: '1080p 60fps',
      desc: 'Screen-space reflections, real-time GI DDGI approximation, temporal anti-aliasing.',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      tech: 'Client WebGPU'
    },
    {
      id: 'tier2-ai-enhance',
      name: 'Tier 2: AI-Enhanced Render',
      time: '5 - 15 seconds',
      res: '4K Photorealism',
      desc: 'SDXL + ControlNet depth/canny/segmentation ensemble. Style locked across rooms via IP-Adapter.',
      icon: <Wand2 className="w-4 h-4 text-indigo-400" />,
      tech: 'LoRA + ESRGAN'
    },
    {
      id: 'tier3-pathtrace',
      name: 'Tier 3: Cloud GPU Path-Tracing',
      time: '1 - 10 minutes',
      res: '8K Ultra HD',
      desc: 'NVIDIA H100 Cloud Cluster. Full path tracing with caustics, subsurface scattering, OptiX AI Denoiser.',
      icon: <Cloud className="w-4 h-4 text-cyan-400" />,
      tech: 'USD + Cycles'
    },
    {
      id: 'tier4-cinematic',
      name: 'Tier 4: Cinematic Animation',
      time: '10 - 30 minutes',
      res: '4K 60fps Video',
      desc: 'AI-generated cinematic camera paths, lens flare, depth-of-field, AI audio narration explaining design.',
      icon: <Video className="w-4 h-4 text-purple-400" />,
      tech: 'NeRF Flythrough'
    },
    {
      id: 'tier5-immersive',
      name: 'Tier 5: Immersive AR / VR',
      time: 'Instant Stream',
      res: 'Dual 4K Eye',
      desc: 'WebXR walkthrough for Meta Quest 3 & Apple Vision Pro + AR full-room overlay QR code.',
      icon: <Glasses className="w-4 h-4 text-pink-400" />,
      tech: 'WebXR / ARKit'
    }
  ];

  const handleStartRender = () => {
    setIsRendering(true);
    setRenderProgress(10);
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const beforeImg = 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80'; // shaded/clay style
  const afterImg = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80'; // photorealistic Japandi

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950 text-slate-100 select-none">
      {/* Studio Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Rendering & Visualization Pipeline
          </div>
          <h1 className="text-2xl font-black tracking-tight">AURA Render Farm & Visual Engine</h1>
          <p className="text-slate-400 text-sm mt-1">From instant WebGPU viewport to 8K path tracing and Apple Vision Pro spatial VR.</p>
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

      {/* Tier Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tiers.map((t) => {
          const isActive = activeTier === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setActiveTier(t.id)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/40 shadow-xl'
                  : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'
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

      {/* Main Studio Viewport: Interactive Before / After Slider */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-slate-100">
              Real-time Viewport ↔ Tier 2 AI Photorealism Comparison
            </h2>
            <p className="text-xs text-slate-400">Drag slider to compare 3D G-Buffer wire/clay against SDXL upscaled caustics & lighting.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartRender}
              disabled={isRendering}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRendering ? 'animate-spin' : ''}`} />
              <span>{isRendering ? `Rendering ${renderProgress}%...` : 'Run Cloud GPU Render'}</span>
            </button>
            <button onClick={() => alert("Render image downloaded as 4K PNG.")} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300" title="Download 4K">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comparison Box */}
        <div className="relative aspect-16/9 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 select-none shadow-2xl">
          {/* After image (background) */}
          <img src={afterImg} alt="Photorealistic After" className="absolute inset-0 w-full h-full object-cover" />
          
          {/* Before image (clipped width) */}
          <div 
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img src={beforeImg} alt="Viewport Before" className="absolute inset-0 w-[100vw] max-w-none h-full object-cover grayscale brightness-90 contrast-125" />
            <div className="absolute top-4 left-4 bg-slate-950/90 px-3 py-1 rounded font-mono text-xs font-bold text-slate-300 border border-slate-800">
              3D VIEWPORT G-BUFFER
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-indigo-600/90 px-3 py-1 rounded font-mono text-xs font-bold text-white shadow">
            4K SDXL PHOTOREALISTIC AI
          </div>

          {/* Slider Line & Handle */}
          <div 
            className="absolute inset-y-0 w-1 bg-gradient-to-b from-indigo-400 via-purple-500 to-pink-500 cursor-ew-resize shadow-[0_0_15px_rgba(99,102,241,1)]"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-indigo-400 flex items-center justify-center text-white shadow-xl text-[10px] font-mono">
              ↔
            </div>
          </div>

          {/* Invisible slider input */}
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />
        </div>
      </div>

      {/* Tier 5 Immersive / AR QR Box */}
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
          <button onClick={() => alert("Cinematic MP4 Walkthrough queued on Cloud Render Farm.")} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold">
            Export 9:16 Vertical Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};

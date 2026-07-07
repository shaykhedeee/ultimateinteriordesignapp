import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Database, 
  Network, 
  Server, 
  Layers, 
  CheckCircle2, 
  DollarSign
} from 'lucide-react';

export const BrainArchitecture: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'client' | 'engine' | 'ai' | 'backend' | 'data'>('all');

  const agents = [
    { name: 'Master Agent', model: 'Fine-Tuned LLaMA 3.1 70B', role: 'Understands intent, orchestrates sub-agents, resolves design conflicts', color: 'border-indigo-500 text-indigo-300 bg-indigo-950/40' },
    { name: 'Design Agent', model: 'Style & Layout GNN', role: 'Generates cohesive 60-30-10 color palettes, matches furniture arrangements', color: 'border-purple-500 text-purple-300 bg-purple-950/40' },
    { name: 'Technical Agent', model: 'Structural & MEP AI', role: 'Building code validation, load-bearing analysis, electrical/plumbing rough-ins', color: 'border-blue-500 text-blue-300 bg-blue-950/40' },
    { name: 'Commerce Agent', model: 'Dual-Encoder CLIP', role: 'Live API vendor matching, real-time price optimization, PO automation', color: 'border-emerald-500 text-emerald-300 bg-emerald-950/40' },
    { name: 'Render & Spatial Agent', model: 'Florence-2 + SDXL', role: 'Traffic flow pathfinding, ergonomic reach zones, photorealistic upscaling', color: 'border-amber-500 text-amber-300 bg-amber-950/40' }
  ];

  const memoryLayers = [
    { type: 'Short-Term Memory', db: 'Redis 7 Cluster', content: 'Current active project context, real-time Yjs CRDT selection state, 60fps buffers' },
    { type: 'Long-Term Memory', db: 'Pinecone Vector DB', content: 'User Style DNA preferences, high-dimensional CLIP design embeddings' },
    { type: 'Episodic Memory', db: 'Neo4j Graph DB', content: 'Past project structural learnings, spatial relationship mappings' },
    { type: 'Semantic Memory', db: 'LlamaIndex RAG Pipeline', content: 'Interior design textbooks, regional building regulations, Vastu knowledge base' }
  ];

  const plans = [
    { tier: 'FREE Tier', target: 'Homeowners / DIY', price: '$0', features: ['1 project, 3 rooms', 'AI auto-design (2 options)', 'Basic WebGPU viewport', '5 AI renders/month'] },
    { tier: 'PRO Tier', target: 'Interior Designers', price: '$49/mo', popular: true, features: ['Unlimited projects & rooms', 'AI auto-design (Unlimited)', 'Full 3D WebGPU + CAD engine', '100 AI renders + 10 Path-Trace', 'Client Portal (10 clients)'] },
    { tier: 'STUDIO Tier', target: 'Design Firms / Studios', price: '$199/mo', features: ['Up to 10 team members', 'Real-time CRDT collaboration', 'Unlimited AI & Cloud Renders', 'VR/AR walkthrough generation', 'White-label presentation suites'] }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-slate-950 text-slate-100 select-none">
      {/* Title */}
      <div className="glass-panel-accent p-8 rounded-3xl space-y-3">
        <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Network className="w-4 h-4 text-cyan-400" /> AURA Technical Blueprint & Architecture
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Architecture & Core AI Engine</h1>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          The AURA platform integrates real-time WebGPU viewport, CRDT multiplayer sync, and a fine-tuned 70B LLaMA Master Agent backed by Vector and Graph RAG pipelines.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {(['all', 'client', 'engine', 'ai', 'backend', 'data'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setActiveLayer(l)}
              className={`px-3 py-1 rounded-lg font-mono text-xs uppercase transition ${
                activeLayer === l ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {l === 'all' ? 'All Architecture Layers' : `${l} layer`}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Diagram Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" /> Platform Architecture Stack
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className={`p-5 rounded-2xl border transition ${activeLayer === 'all' || activeLayer === 'client' ? 'border-indigo-500 bg-slate-900/80 shadow-lg' : 'border-slate-800 bg-slate-900/30 opacity-60'}`}>
            <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">CLIENT LAYER</div>
            <h3 className="font-bold text-sm mb-2">Multi-Device Apps</h3>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li>• React 19 Web App</li>
              <li>• Tauri 2.0 Desktop</li>
              <li>• Flutter Mobile App</li>
              <li>• Quest / Vision Pro</li>
            </ul>
          </div>

          <div className={`p-5 rounded-2xl border transition ${activeLayer === 'all' || activeLayer === 'engine' ? 'border-purple-500 bg-slate-900/80 shadow-lg' : 'border-slate-800 bg-slate-900/30 opacity-60'}`}>
            <div className="text-[10px] font-mono text-purple-400 font-bold mb-1">REAL-TIME ENGINE</div>
            <h3 className="font-bold text-sm mb-2">WebGPU & Physics</h3>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li>• Three.js + WebGPU</li>
              <li>• Rapier Physics WASM</li>
              <li>• Yjs CRDT Sync</li>
              <li>• CAD Vector Engine</li>
            </ul>
          </div>

          <div className={`p-5 rounded-2xl border transition ${activeLayer === 'all' || activeLayer === 'ai' ? 'border-cyan-500 bg-slate-900/80 shadow-lg ring-1 ring-cyan-500/30' : 'border-slate-800 bg-slate-900/30 opacity-60'}`}>
            <div className="text-[10px] font-mono text-cyan-400 font-bold mb-1">AI ORCHESTRATION</div>
            <h3 className="font-bold text-sm mb-2">AURA Brain 70B</h3>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li>• Design Gen GNN</li>
              <li>• Spatial Planning AI</li>
              <li>• Style Transfer LoRA</li>
              <li>• NLP Command LLM</li>
            </ul>
          </div>

          <div className={`p-5 rounded-2xl border transition ${activeLayer === 'all' || activeLayer === 'backend' ? 'border-emerald-500 bg-slate-900/80 shadow-lg' : 'border-slate-800 bg-slate-900/30 opacity-60'}`}>
            <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">BACKEND SERVICES</div>
            <h3 className="font-bold text-sm mb-2">Rust Axum Services</h3>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li>• Rust Axum API</li>
              <li>• WebSocket Tokio</li>
              <li>• Autoscaling GPU Farm</li>
              <li>• Stripe/IKEA API</li>
            </ul>
          </div>

          <div className={`p-5 rounded-2xl border transition ${activeLayer === 'all' || activeLayer === 'data' ? 'border-amber-500 bg-slate-900/80 shadow-lg' : 'border-slate-800 bg-slate-900/30 opacity-60'}`}>
            <div className="text-[10px] font-mono text-amber-400 font-bold mb-1">DATA & STORAGE</div>
            <h3 className="font-bold text-sm mb-2">Vector & Graph DBs</h3>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li>• PostgreSQL + PostGIS</li>
              <li>• Pinecone Vector DB</li>
              <li>• Neo4j Knowledge</li>
              <li>• Cloudflare R2 Assets</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Multi-Agent Architecture */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-indigo-400" /> Core AI Engine: "AURA BRAIN" Multi-Agent Topology
            </h2>
            <p className="text-xs text-slate-400 mt-1">Master Agent delegates user prompts and constraints asynchronously across specialized sub-agents.</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-950/50 px-3 py-1 rounded-full">vLLM TensorRT Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((ag, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border ${ag.color} flex flex-col justify-between space-y-3`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{ag.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-slate-200">{ag.model}</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed mt-2">{ag.role}</p>
              </div>
              <div className="text-[10px] font-mono opacity-75 pt-2 border-t border-white/10 flex items-center justify-between">
                <span>Status: Synchronized</span>
                <span>Sub-Agent OK</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memory System & RAG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2 text-cyan-300">
            <Database className="w-5 h-5 text-cyan-400" /> Multi-Layer Memory & RAG Pipeline
          </h3>
          <div className="space-y-3">
            {memoryLayers.map((mem, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>{mem.type}</span>
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{mem.db}</span>
                </div>
                <p className="text-xs text-slate-400">{mem.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-purple-300">
              <Server className="w-5 h-5 text-purple-400" /> CRDT Collaborative Editing Engine
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Real-time multiplayer synchronization powered by <span className="text-purple-300 font-mono font-bold">Yjs CRDT framework</span>. Eliminates conflict resolution latency across designers, clients, and MEP engineers.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-900 font-mono text-[11px] text-slate-300 space-y-1.5 border border-purple-500/20">
              <div className="text-purple-400 font-bold">Y.Doc (Project Document Sync)</div>
              <div className="pl-3 text-slate-400">├── Y.Map("floorPlan") [walls, openings]</div>
              <div className="pl-3 text-slate-400">├── Y.Map("placements") [item_pos, rot, scale]</div>
              <div className="pl-3 text-slate-400">├── Y.Map("materials") [PBR texture mappings]</div>
              <div className="pl-3 text-slate-400">└── Y.Map("cursors") [live collaborative awareness]</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between font-mono">
            <span>WebSocket + IndexedDB Offline Sync</span>
            <span className="text-emerald-400 font-bold">0 Conflict Drops</span>
          </div>
        </div>
      </div>

      {/* Monetization Strategy */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" /> AURA Monetization & Subscription Tiers
          </h2>
          <span className="text-xs text-slate-400 font-mono">Turnkey SaaS Strategy</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((pl, idx) => (
            <div key={idx} className={`glass-panel p-6 rounded-3xl border flex flex-col justify-between space-y-6 relative ${pl.popular ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/40 shadow-2xl shadow-indigo-500/10' : 'border-slate-800'}`}>
              {pl.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 font-mono text-[10px] font-extrabold text-white shadow">
                  MOST POPULAR (DESIGNERS)
                </span>
              )}
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase">{pl.target}</div>
                  <h3 className="text-xl font-black text-slate-100 mt-1">{pl.tier}</h3>
                  <div className="text-3xl font-extrabold text-indigo-400 font-mono mt-2">{pl.price}</div>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  {pl.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className={`w-full py-3 rounded-xl font-bold text-xs transition ${pl.popular ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}>
                {pl.price === '$0' ? 'Start Free Plan' : 'Upgrade to ' + pl.tier.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

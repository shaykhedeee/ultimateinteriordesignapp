'use client';

import { useEffect, useState, useRef } from 'react';
import { apiGet } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import * as THREE from 'three';

type Project = {
  id: string;
  name: string;
  stage: string;
  budgetBand?: string;
  readiness?: { score: number; nextRequiredAction?: string };
};

type Lead = { id: string; name?: string; contact?: string; requirement?: string; value?: number };
type RenderVariant = { id: string; name: string; url: string; score: number; style: string; materials: string[] };

export function CommandCenterScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'smart' | 'generate' | 'photo' | 'layout' | 'product'>('smart');

  // Load backend stats
  useEffect(() => {
    apiGet<Project[]>('/projects').then(setProjects).catch(console.error);
    apiGet<Lead[]>('/leads').then(setLeads).catch(console.error);
  }, []);

  const totalLeads = leads.length;
  const activeProjectsCount = projects.length;
  const pendingApprovalsCount = projects.filter((p) => p.stage === 'client_approval_pending').length;
  const productionCount = projects.filter((p) => p.stage === 'production_preparation' || p.stage === 'production_ready').length;

  // Pipeline valuation in ₹ Lakhs (Leads average 3.5L, projects average 12.5L)
  const pipelineValue = ((totalLeads * 3.5) + (activeProjectsCount * 12.5)).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* System Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #111113 0%, #1e1e24 100%)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ULTIDA OS <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginLeft: 8 }}>v3.1 Stable</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Unified modular geometry, interactive CAD layouts, PBR styling, and estimate workflows.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#2dd4bf',
            boxShadow: '0 0 10px #2dd4bf',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Active
          </span>
        </div>
      </div>

      {/* KPI ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16
      }}>
        {[
          { label: 'Leads In Queue', val: totalLeads, sub: 'Intake and brief' },
          { label: 'Active Projects', val: activeProjectsCount, sub: 'In design pipeline' },
          { label: 'Pending Approvals', val: pendingApprovalsCount, sub: 'Awaiting client signoff' },
          { label: 'Production Ready', val: productionCount, sub: 'BOM & drawings frozen' },
          { label: 'Pipeline Valuation', val: `₹${pipelineValue}L`, sub: 'Estimated yield basis' },
        ].map((kpi, idx) => (
          <div key={idx} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '16px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 3,
              height: '100%',
              backgroundColor: idx === 4 ? 'var(--gold)' : 'var(--border)'
            }} />
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, margin: '6px 0 2px', color: 'var(--text-primary)' }}>{kpi.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Workflow Hub Navigation Tabs */}
      <div>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          gap: 4,
          marginBottom: 16
        }}>
          {[
            { id: 'smart', label: '🚀 Smart Project', desc: 'Plan to Scene' },
            { id: 'generate', label: '🎨 Quick Generate', desc: 'Style to Concept' },
            { id: 'photo', label: '📸 Photo Edit', desc: 'Reference Swapping' },
            { id: 'layout', label: '📐 Quick Layout', desc: 'Fast 2D Sketcher' },
            { id: 'product', label: '⚙️ Design Product', desc: 'Parametric Cabinets' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '10px 18px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flex: 1
              }}
            >
              <span style={{
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-primary)'
              }}>{tab.label}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* Tab Workspaces */}
        <div style={{ minHeight: 380 }}>
          {activeTab === 'smart' && <SmartProjectWorkspace projects={projects} />}
          {activeTab === 'generate' && <QuickGenerateWorkspace />}
          {activeTab === 'photo' && <PhotoEditWorkspace />}
          {activeTab === 'layout' && <QuickLayoutWorkspace />}
          {activeTab === 'product' && <DesignProductWorkspace />}
        </div>
      </div>

      {/* Underneath: Tools grid & Active project checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        {/* AI Specialist Tools Grid */}
        <Panel title="🛠️ AI Specialist Tools Hub">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12
          }}>
            {[
              { title: 'Upload Blueprint', desc: 'Parse CAD PDF/Image', link: '/plan-review' },
              { title: 'Align Calibration', desc: 'Setup physical scale', link: '/plan-review' },
              { title: 'Zonation Editor', desc: 'Tag rooms & opening labels', link: '/plan-review' },
              { title: 'Laminate Swapper', desc: 'Assign PBR sheet codes', link: '/design-studio' },
              { title: 'Camera Planner', desc: 'Setup key viewpoints', link: '/render-studio' },
              { title: 'Walkthrough Config', desc: 'Reorder framing sequence', link: '/render-studio' },
              { title: 'SVG Elevation Builder', desc: 'Auto-dimension drawings', link: '/drawings' },
              { title: 'BOM Cost Calculator', desc: 'SQFT board yield schedules', link: '/drawings' },
              { title: 'Invoice Ledger', desc: 'Milestones & GST logs', link: '/finance' }
            ].map((tool, idx) => (
              <a
                key={idx}
                href={tool.link as any}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{tool.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tool.desc}</div>
              </a>
            ))}
          </div>
        </Panel>

        {/* Project Pipeline Overview */}
        <Panel title="📈 Active Project Pipeline">
          <div className="listMock" style={{ maxHeight: 270, overflowY: 'auto' }}>
            {projects.length ? projects.map((project) => (
              <div className="rowMock" key={project.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{project.name}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                    Stage: <span style={{ color: 'var(--gold)' }}>{project.stage.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>
                    Readiness: {project.readiness?.score ?? 0}%
                  </div>
                  <a href={`/design-studio?projectId=${project.id}` as any}>
                    <button style={{ padding: '2px 6px', fontSize: 10, marginTop: 4 }}>Open Studio</button>
                  </a>
                </div>
              </div>
            )) : <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>No active projects. Upload a plan to begin.</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ==========================================
   WORKSPACE 1: Smart Project
   ========================================== */
function SmartProjectWorkspace({ projects }: { projects: Project[] }) {
  const [uploading, setUploading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      alert('Floor plan uploaded successfully! Proceeding to calibration and scale alignment.');
      window.location.href = '/plan-review' as any;
    }, 2000);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20
    }}>
      <div>
        <h3 style={{ margin: '0 0 10px', fontSize: 16, color: 'var(--gold)' }}>End-to-End Smart Project Pipeline</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Convert blueprints to calibrated spatial layout scenes, assign PBR material finishes, generate high-res renders, vector CAD elevation packs, and production BOMs.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Select Active Project Target:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ maxWidth: 300, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: 4, color: 'var(--text-primary)' }}
          >
            <option value="">-- Choose Existing Project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.stage})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <a href="/plan-review" style={{ display: 'inline-block' }}>
            <button style={{ backgroundColor: 'var(--gold)', color: '#000', fontWeight: 600 }}>
              1. Calibrate Floorplan
            </button>
          </a>
          <a href="/design-studio" style={{ display: 'inline-block' }}>
            <button>2. Edit 3D Geometry</button>
          </a>
        </div>
      </div>

      <div style={{
        border: '2px dashed var(--border)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: 'rgba(255,255,255,0.01)',
        cursor: 'pointer'
      }} onClick={handleUpload}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📤</div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{uploading ? 'Parsing PDF Blueprint...' : 'Upload Floor Plan Blueprint'}</div>
        <div className="muted" style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
          Supports high-res JPG, PNG, or vectorized architectural PDF drawings
        </div>
        {uploading && (
          <div style={{ width: '80%', height: 4, background: '#1e1e24', borderRadius: 2, marginTop: 16, overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', backgroundColor: 'var(--gold)' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================
   WORKSPACE 2: Quick Generate (AI Concepts)
   ========================================== */
const REFRESH_PRESET_IMAGES: RenderVariant[] = [
  { id: '1', name: 'Luxury Living Walnut', url: '/images/living-room-evening-3d-01.jpg', score: 96, style: 'Modern Luxury', materials: ['Smoked Walnut veneer', 'Statutario Marble'] },
  { id: '2', name: 'Japandi Minimal Living', url: '/images/living-room-scandinavian-3d-01.jpg', score: 92, style: 'Japandi Suede', materials: ['Light Suede Laminate', 'Fitted Oak Slats'] },
  { id: '3', name: 'Contemporary Cozy Office', url: '/images/home-office-modern-3d-01.jpg', score: 89, style: 'Scandi Minimalist', materials: ['White Matte Acrylic', 'Natural Birchwood'] },
];

function QuickGenerateWorkspace() {
  const [roomType, setRoomType] = useState('living');
  const [stylePreset, setStylePreset] = useState('Modern Luxury');
  const [prompt, setPrompt] = useState('Wooden slats wall backer with floating black marble shelf and bronze cove-lit channels');
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedResults, setGeneratedResults] = useState<RenderVariant[]>([]);

  const steps = [
    'Parsing spatial boundaries...',
    'Loading material textures...',
    'Evaluating lighting directions...',
    'Baking global ambient occlusion...',
    'Refining pixel denoiser...'
  ];

  const handleGenerate = () => {
    setGenerating(true);
    setCurrentStep(0);
    setGeneratedResults([]);

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setGenerating(false);
          setGeneratedResults(REFRESH_PRESET_IMAGES);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3fr 4fr',
      gap: 20,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20
    }}>
      {/* Parameter Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--gold)' }}>Spatial Concept Generator</h3>

        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Select Room Target Zone:</label>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
            <option value="living">Living Room (Media Zone)</option>
            <option value="kitchen">Modular L-Shape Kitchen</option>
            <option value="bedroom">Master Suite Bedroom</option>
            <option value="mandir">Compact Mandir Pooja Alcove</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Design Aesthetic Style Presets:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Modern Luxury', 'Japandi Suede', 'Scandi Minimalist', 'Classical Mandir'].map((st) => (
              <button
                key={st}
                onClick={() => setStylePreset(st)}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  borderRadius: 20,
                  backgroundColor: stylePreset === st ? 'var(--gold)' : '#232927',
                  color: stylePreset === st ? '#0d1110' : '#f4f0e8',
                  border: 'none'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Detailed Style Prompt Instructions:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            style={{ resize: 'none', fontSize: 12 }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            backgroundColor: 'var(--gold)',
            color: '#000',
            fontWeight: 600,
            marginTop: 10,
            padding: '10px 0'
          }}
        >
          {generating ? 'Processing Concept...' : '✨ Generate Concept Render'}
        </button>
      </div>

      {/* Visual output zone */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: '#0d1110',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 320,
        position: 'relative'
      }}>
        {generating && (
          <div style={{ textAlign: 'center', width: '80%' }}>
            <div style={{ fontSize: 24, display: 'inline-block', marginBottom: 12 }}>⚙️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>AI Synthesis Engine Running</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, minHeight: 18 }}>
              {steps[currentStep]}
            </div>
            <div style={{ width: '100%', height: 4, backgroundColor: '#1e1e24', borderRadius: 2, marginTop: 14, overflow: 'hidden' }}>
              <div style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--gold)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        )}

        {!generating && generatedResults.length === 0 && (
          <div className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
            Configure the parameters on the left and click Generate to synthesize geometry-aware render concepts.
          </div>
        )}

        {!generating && generatedResults.length > 0 && (
          <div style={{ width: '100%' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--gold)' }}>Synthesized Variants</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {generatedResults.map((item) => (
                <div key={item.id} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}>
                  <div style={{ position: 'relative', height: 100 }}>
                    <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'var(--gold)',
                      fontSize: 9,
                      padding: '1px 4px',
                      borderRadius: 3
                    }}>
                      {item.score}% Match
                    </span>
                  </div>
                  <div style={{ padding: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div className="muted" style={{ fontSize: 9, marginTop: 2 }}>{item.style}</div>
                    <button style={{ width: '100%', padding: '2px 0', fontSize: 8, marginTop: 6 }} onClick={() => alert(`Saved Concept '${item.name}' as a project branch!`)}>
                      Save as Branch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================
   WORKSPACE 3: Photo Edit (Interactive Masking)
   ========================================== */
function PhotoEditWorkspace() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isMasking, setIsMasking] = useState(false);
  const [prompt, setPrompt] = useState('Change laminate finish to high gloss slate gray');
  const [processing, setProcessing] = useState(false);
  const [editedPhotoUrl, setEditedPhotoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // File picker simulation
  const triggerPicker = () => {
    setPhotoUrl('/images/tv_unit_render_final.png');
    setEditedPhotoUrl(null);
  };

  // Draw image and paint mask
  useEffect(() => {
    if (!photoUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = photoUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth > 600 ? 600 : img.naturalWidth;
      canvas.height = img.naturalHeight > 450 ? 450 : img.naturalHeight;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [photoUrl]);

  // Mask drawing listener
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMasking(true);
    drawMaskPoint(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMasking) return;
    drawMaskPoint(e);
  };

  const drawMaskPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.fillStyle = 'rgba(201, 168, 76, 0.4)'; // Gold translucent highlight
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
  };

  const executeEdit = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setEditedPhotoUrl('/images/statutario_marble_tv_1779969617129.png');
    }, 2000);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3fr 4fr',
      gap: 20,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--gold)' }}>AI Reference & Photo Editor</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Upload room photos, paint target brush masks to select drawers/shutters, and replace finishes instantly.
        </p>

        {!photoUrl ? (
          <button onClick={triggerPicker} style={{ height: 120, border: '1px dashed var(--border)', background: 'transparent' }}>
            <span>📸 Load Sample Design Photo</span>
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Step 2: Type Replacement Prompt:</label>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ fontSize: 12, marginTop: 4 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={executeEdit} style={{ flex: 1, backgroundColor: 'var(--gold)', color: '#000', fontWeight: 600 }}>
                {processing ? 'Editing photo...' : 'Run Replacement'}
              </button>
              <button onClick={() => { setPhotoUrl(null); setEditedPhotoUrl(null); }} style={{ border: 'none', background: '#303030' }}>
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: '#0d1110',
        padding: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {processing && (
          <div style={{ position: 'absolute', zIndex: 10, textTransform: 'uppercase', fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>
            Processing Texture replacement...
          </div>
        )}

        {!photoUrl && (
          <div className="muted" style={{ fontSize: 12 }}>
            Click Load Sample Photo on the left to start masking.
          </div>
        )}

        {photoUrl && !editedPhotoUrl && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.7)', fontSize: 9, padding: '2px 6px', borderRadius: 4 }}>
              Paint with your mouse to mask targeted replacement zones
            </div>
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={() => setIsMasking(false)}
              style={{ display: 'block', maxWidth: '100%', borderRadius: 4, cursor: 'crosshair' }}
            />
          </div>
        )}

        {editedPhotoUrl && (
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Original Space</div>
              <img src={photoUrl!} alt="Original" style={{ width: '100%', height: 'auto', borderRadius: 4 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 4 }}>Edited Space</div>
              <img src={editedPhotoUrl} alt="Edited" style={{ width: '100%', height: 'auto', borderRadius: 4 }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================
   WORKSPACE 4: Quick Layout (2D Sketcher Canvas)
   ========================================== */
type LayoutBlock = { id: string; type: string; x: number; y: number; w: number; h: number; rot: number };

function QuickLayoutWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);
  const [tool, setTool] = useState<'wall' | 'select' | 'sofa' | 'bed' | 'wardrobe'>('select');
  const [walls, setWalls] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const [tempWallPoint, setTempWallPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0d1110';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = '#1a1f1e';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Walls
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    walls.forEach((w) => {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();

      // Show dimension label
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const lenMm = Math.round(Math.sqrt(dx * dx + dy * dy) * 20); // 1px = 20mm
      const mx = (w.x1 + w.x2) / 2;
      const my = (w.y1 + w.y2) / 2;
      ctx.fillStyle = 'var(--gold)';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${lenMm} mm`, mx + 4, my - 4);
    });

    // Draw temp wall dragging line
    if (tempWallPoint && tool === 'wall') {
      ctx.strokeStyle = 'var(--gold)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(tempWallPoint.x, tempWallPoint.y);
      ctx.lineTo(tempWallPoint.x, tempWallPoint.y); // just indicator placeholder
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Furniture Blocks
    blocks.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = 'rgba(201, 168, 76, 0.25)';
      ctx.strokeStyle = 'var(--gold)';
      ctx.lineWidth = 2;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);

      // Label text
      ctx.fillStyle = '#f0eee8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.type.toUpperCase(), 0, 3);
      ctx.restore();
    });
  }, [walls, blocks, tempWallPoint, tool]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / 20) * 20; // Snap to 20px grid
    const y = Math.round((e.clientY - rect.top) / 20) * 20;

    if (tool === 'wall') {
      if (!tempWallPoint) {
        setTempWallPoint({ x, y });
      } else {
        setWalls([...walls, { x1: tempWallPoint.x, y1: tempWallPoint.y, x2: x, y2: y }]);
        setTempWallPoint(null);
      }
    } else if (['sofa', 'bed', 'wardrobe'].includes(tool)) {
      const w = tool === 'sofa' ? 80 : tool === 'bed' ? 100 : 50;
      const h = tool === 'sofa' ? 40 : tool === 'bed' ? 90 : 30;
      setBlocks([...blocks, {
        id: String(Date.now()),
        type: tool,
        x,
        y,
        w,
        h,
        rot: 0
      }]);
      setTool('select');
    }
  };

  const handleClear = () => {
    setWalls([]);
    setBlocks([]);
    setTempWallPoint(null);
  };

  const promoteLayout = () => {
    alert('Quick Layout promoted to main Spatial Scene Version!');
    window.location.href = '/design-studio' as any;
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3fr 4fr',
      gap: 20,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--gold)' }}>2D Quick Layout Sketcher</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Sketch wall outlines, doors, openings, and drop modular carcass templates to synthesize layouts fast.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Active CAD Tool:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button onClick={() => setTool('wall')} style={{ backgroundColor: tool === 'wall' ? 'var(--gold)' : 'transparent', color: tool === 'wall' ? '#000' : 'var(--text-primary)' }}>
              ✏️ Draw Wall
            </button>
            <button onClick={() => setTool('select')} style={{ backgroundColor: tool === 'select' ? 'var(--gold)' : 'transparent', color: tool === 'select' ? '#000' : 'var(--text-primary)' }}>
              🖱️ Select Block
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Place Furniture Block Symbols:</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setTool('sofa')} style={{ padding: '4px 8px', fontSize: 11 }}>🛋️ Sofa</button>
            <button onClick={() => setTool('bed')} style={{ padding: '4px 8px', fontSize: 11 }}>🛏️ Bed</button>
            <button onClick={() => setTool('wardrobe')} style={{ padding: '4px 8px', fontSize: 11 }}>🚪 Wardrobe</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={promoteLayout} style={{ flex: 1, backgroundColor: 'var(--gold)', color: '#000', fontWeight: 600 }}>
            Promote to Scene
          </button>
          <button onClick={handleClear} style={{ border: 'none', background: '#303030' }}>
            Clear Canvas
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <canvas
          ref={canvasRef}
          width={420}
          height={320}
          onClick={handleCanvasClick}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 6,
            cursor: tool === 'wall' ? 'crosshair' : 'default',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}

/* ==========================================
   WORKSPACE 5: Design Product (Parametric Cabinets)
   ========================================== */
function DesignProductWorkspace() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [widthMm, setWidthMm] = useState(1200);
  const [heightMm, setHeightMm] = useState(900);
  const [depthMm, setDepthMm] = useState(500);

  const [boardMaterial, setBoardMaterial] = useState('HDMR');
  const [shutterFinish, setShutterFinish] = useState('Acrylic');

  // Three.js setup refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);

  // Set up Three.js canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1110);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2, 1.8, 2.5);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Grid helper
    const grid = new THREE.GridHelper(4, 12, 0x222222, 0x111111);
    scene.add(grid);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(4, 6, 3);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Initial Primitive Cabinet Box
    const geo = new THREE.BoxGeometry(1.2, 0.9, 0.5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      roughness: 0.5,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.45;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Box Wireframe Overlay
    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.y = 0.45;
    scene.add(wireframe);
    wireframeRef.current = wireframe;

    // Render loop & mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = () => { isDragging = true; };
    const handleMouseMove = (e: MouseEvent) => {
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
      };

      if (isDragging && meshRef.current) {
        meshRef.current.rotation.y += deltaMove.x * 0.01;
        if (wireframeRef.current) {
          wireframeRef.current.rotation.y += deltaMove.x * 0.01;
        }
      }

      previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY
      };
    };
    const handleMouseUp = () => { isDragging = false; };

    const canvasElement = renderer.domElement;
    canvasElement.addEventListener('mousedown', handleMouseDown);
    canvasElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    let animationFrameId: number;
    const animate = () => {
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvasElement.removeEventListener('mousedown', handleMouseDown);
      canvasElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update geometry scale and color dynamically
  useEffect(() => {
    if (!meshRef.current || !wireframeRef.current) return;
    const mesh = meshRef.current;
    const wireframe = wireframeRef.current;

    // Scale cabinet
    mesh.scale.set(widthMm / 1200, heightMm / 900, depthMm / 500);
    wireframe.scale.set(widthMm / 1200, heightMm / 900, depthMm / 500);

    mesh.position.y = heightMm / 2000;
    wireframe.position.y = heightMm / 2000;

    // Adjust color based on finish
    const colorHex = shutterFinish === 'Acrylic' ? 0xc9a84c : shutterFinish === 'PU Lacquer' ? 0x222222 : 0x8b6f35;
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.color.setHex(colorHex);
  }, [widthMm, heightMm, depthMm, shutterFinish]);

  // Formulas for SQFT / BOM / edge-banding
  const carcassSqft = (((widthMm * depthMm * 2) + (heightMm * depthMm * 2) + (widthMm * heightMm)) / 92903.04).toFixed(1);
  const shutterSqft = ((widthMm * heightMm) / 92903.04).toFixed(1);
  const edgeBandRm = (((widthMm * 4) + (heightMm * 4)) / 1000).toFixed(1);
  const priceEstimated = Math.round((parseFloat(carcassSqft) * 180) + (parseFloat(shutterSqft) * 280) + (parseFloat(edgeBandRm) * 45));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '4fr 5fr',
      gap: 20,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20
    }}>
      {/* Parameter Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--gold)' }}>Parametric Cabinet Generator</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Width (mm): {widthMm}</label>
            <input type="range" min={600} max={2400} step={50} value={widthMm} onChange={(e) => setWidthMm(parseInt(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Height (mm): {heightMm}</label>
            <input type="range" min={750} max={2400} step={50} value={heightMm} onChange={(e) => setHeightMm(parseInt(e.target.value))} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Depth (mm): {depthMm}</label>
          <input type="range" min={300} max={750} step={50} value={depthMm} onChange={(e) => setDepthMm(parseInt(e.target.value))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Board Core Ply:</label>
            <select value={boardMaterial} onChange={(e) => setBoardMaterial(e.target.value)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', color: 'var(--text-primary)' }}>
              <option value="HDMR">Action Tesa HDMR</option>
              <option value="BWP Plywood">CenturyBWP Plywood</option>
              <option value="BWR Plywood">Merino BWR Plywood</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Shutter Finish:</label>
            <select value={shutterFinish} onChange={(e) => setShutterFinish(e.target.value)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', color: 'var(--text-primary)' }}>
              <option value="Acrylic">High Gloss Acrylic</option>
              <option value="PU Lacquer">PU Matte Lacquer</option>
              <option value="Suede">Suede Finish Laminate</option>
            </select>
          </div>
        </div>

        {/* Dynamic Calculations */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '10px 12px',
          marginTop: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span className="muted">Carcass Ply Yield:</span>
            <span>{carcassSqft} SQFT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span className="muted">Shutters Yield:</span>
            <span>{shutterSqft} SQFT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span className="muted">Edge Banding:</span>
            <span>{edgeBandRm} Running Meters</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 6 }}>
            <span style={{ color: 'var(--gold)' }}>Est SV Cost (Excl. Tax):</span>
            <span style={{ color: 'var(--gold)' }}>₹{priceEstimated.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button onClick={() => alert('Custom Cabinet successfully added to Spatial Catalog!')} style={{ backgroundColor: 'var(--gold)', color: '#000', fontWeight: 600 }}>
          💾 Save to Project Catalog
        </button>
      </div>

      {/* 3D Viewport container */}
      <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', height: 280, display: 'block' }} />
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 10,
          color: 'var(--text-secondary)'
        }}>
          🖱️ Click and Drag to Rotate Camera View
        </div>
      </div>
    </div>
  );
}

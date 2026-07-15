import React from 'react';
import {
  FileText, Ruler, Box, Compass, Wand2, PencilRuler, Sparkles,
  Palette, Scissors, IndianRupee, Award, Archive, CheckCircle2, Circle, ChevronDown, ChevronRight
} from 'lucide-react';

// The canonical 12-stage design→delivery journey. Order matters: this is the
// single source of truth for "where am I in the pipeline" shown in the sidebar.
const PIPELINE_STAGES = [
  { id: 'brief',     label: 'Client Intake',         icon: FileText },
  { id: 'cad',       label: 'Plan Intelligence',     icon: Ruler },
  { id: 'studio',    label: 'Editable 3D Scene',     icon: Box },
  { id: 'vastu',     label: 'Vastu Studio',          icon: Compass },
  { id: 'enhancer',  label: 'Floor Plan Enhancer',   icon: Wand2 },
  { id: 'drawings',  label: 'Drawings & Elevations', icon: PencilRuler },
  { id: 'renders',   label: 'Render Studio',         icon: Sparkles },
  { id: 'materials', label: 'Materials Catalog',     icon: Palette },
  { id: 'cutlist',   label: 'Cutlist & Nesting',     icon: Scissors },
  { id: 'finance',   label: 'Commerce & Quotes',     icon: IndianRupee },
  { id: 'presentation', label: 'Presentation Pack',  icon: Award },
  { id: 'vault',     label: 'Deliverables Vault',    icon: Archive }
];

export default function PipelineRail({ activeTab, onNavigate, stepIndex, collapsed = false, onToggleCollapse }) {
  // stepIndex = how many stages are completed (from getStepIndex).
  const activePos = PIPELINE_STAGES.findIndex(s => s.id === activeTab);

  if (collapsed) {
    const activeStage = PIPELINE_STAGES.find(s => s.id === activeTab);
    const activePos = PIPELINE_STAGES.findIndex(s => s.id === activeTab);
    return (
      <button
        onClick={onToggleCollapse}
        className="pipeline-rail pipeline-rail-collapsed"
        title="Expand Design Journey"
        style={{ width:'100%', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', background:'transparent', border:'none', color:'var(--text-muted)' }}
      >
        <ChevronRight style={{ width:14, height:14, flexShrink:0 }} />
        <span className="pipeline-rail-title" style={{ fontSize:'9px', letterSpacing:'0.12em', margin:0, textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>
          STAGE: <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{activeStage?.label?.toUpperCase() || 'DASHBOARD'}</span>
        </span>
        <span style={{ marginLeft:'auto', fontSize:'9.5px', fontFamily:'monospace', color:'var(--text-muted)' }}>
          {activePos >= 0 ? activePos + 1 : 0}/{PIPELINE_STAGES.length}
        </span>
      </button>
    );
  }

  return (
    <div className="pipeline-rail">
      <div className="pipeline-rail-head">
        <div className="pipeline-rail-title">DESIGN JOURNEY</div>
        <button
          onClick={onToggleCollapse}
          className="pipeline-rail-collapse"
          title="Collapse Design Journey"
          style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', padding:'2px' }}
        >
          <ChevronDown style={{ width:13, height:13 }} />
        </button>
      </div>
      <div className="pipeline-rail-list">
        {PIPELINE_STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i === activePos;
          const isDone = i < stepIndex;
          const state = isActive ? 'active' : isDone ? 'done' : 'todo';
          return (
            <button
              key={stage.id}
              onClick={() => onNavigate(stage.id)}
              className={`pipeline-step ${state}`}
              title={stage.label}
            >
              <span className="pipeline-step-dot">
                {isDone
                  ? <CheckCircle2 style={{ width: 13, height: 13 }} />
                  : <Icon style={{ width: 12, height: 12 }} />}
              </span>
              <span className="pipeline-step-label">{stage.label}</span>
              {i < PIPELINE_STAGES.length - 1 && <span className="pipeline-step-line" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

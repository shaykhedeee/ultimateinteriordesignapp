import React from 'react';
import {
  FileText, Ruler, Box, Compass, Wand2, PencilRuler, Sparkles,
  Palette, Scissors, IndianRupee, Award, Archive, CheckCircle2, Circle
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

export default function PipelineRail({ activeTab, onNavigate, stepIndex }) {
  // stepIndex = how many stages are completed (from getStepIndex).
  const activePos = PIPELINE_STAGES.findIndex(s => s.id === activeTab);

  return (
    <div className="pipeline-rail">
      <div className="pipeline-rail-title">DESIGN JOURNEY</div>
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

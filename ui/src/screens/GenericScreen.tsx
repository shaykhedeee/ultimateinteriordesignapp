import { Scan, ChevronRight, Zap, Archive, Settings, FileImage, CheckSquare } from 'lucide-react';

interface Props {
  screen: string;
}

const screenData: Record<string, {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  gradient: string;
  action: string;
}> = {
  'site-capture': {
    title: 'Site Capture',
    description: 'Upload measurements, photos, scans, and LiDAR data from site visits. Organize by floor, room, and surface.',
    icon: <Scan size={32} />,
    features: [
      'Upload photos and sketches',
      'LiDAR / 3D scan ingestion',
      'Manual dimension input',
      'Room-by-room organization',
      'Site notes and markups',
      'AI dimension extraction from photos',
    ],
    color: '#2DD4BF',
    gradient: 'from-[#0A1A18] to-[#0A0A0B]',
    action: 'Start Site Capture',
  },
  'drawings': {
    title: 'Drawings & Elevations Studio',
    description: 'Auto-generate wall elevations, floor plans, section cuts, and room packages from the approved scene model.',
    icon: <FileImage size={32} />,
    features: [
      'Auto wall-by-wall elevations',
      'Annotated floor plan export',
      'Section cuts with dimensions',
      'Room package PDFs',
      'DWG / DXF export',
      'Version-locked drawing sets',
    ],
    color: '#4A7CFF',
    gradient: 'from-[#0A0F1A] to-[#0A0A0B]',
    action: 'Generate Drawings',
  },
  'onboarding': {
    title: 'Discovery Wizard',
    description: 'Structured client onboarding — capture lifestyle, preferences, budget, scope, and references in one guided flow.',
    icon: <CheckSquare size={32} />,
    features: [
      'Room-by-room requirement capture',
      'Style and mood references',
      'Budget range qualification',
      'Family profile and lifestyle inputs',
      'Vastu and cultural preferences',
      'Auto design brief generation',
    ],
    color: '#8B5CF6',
    gradient: 'from-[#120A1A] to-[#0A0A0B]',
    action: 'Start Discovery',
  },
  'deliverables': {
    title: 'Deliverables Vault',
    description: 'Version-controlled archive of all project outputs — renders, drawings, proposals, BOMs, and approval packages.',
    icon: <Archive size={32} />,
    features: [
      'Auto-versioned file archive',
      'Shareable client links',
      'Download bundles by phase',
      'Approval timestamps',
      'Watermark control',
      'Cloud backup and sync',
    ],
    color: '#C9A84C',
    gradient: 'from-[#1A1508] to-[#0A0A0B]',
    action: 'Open Vault',
  },
  'settings': {
    title: 'Settings & Rule Engine',
    description: 'Configure studio defaults, module rules, Indian modular standards, Vastu checks, and workflow automation.',
    icon: <Settings size={32} />,
    features: [
      'Kitchen module dimensions ruleset',
      'Wardrobe clearance standards',
      'Vastu compliance checks',
      'Studio brand configuration',
      'Render and quality defaults',
      'Team roles and permissions',
    ],
    color: '#F59E0B',
    gradient: 'from-[#1A1205] to-[#0A0A0B]',
    action: 'Open Settings',
  },
};

export default function GenericScreen({ screen }: Props) {
  const data = screenData[screen] || screenData['settings'];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0A0A0B]">
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-[600px] w-full text-center space-y-8">

          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-br ${data.gradient} border border-[#2A2A35]`}
            style={{ color: data.color, boxShadow: `0 0 40px ${data.color}18` }}>
            {data.icon}
          </div>

          {/* Text */}
          <div>
            <h2 className="text-[28px] font-bold text-[#F0EEE8] mb-3 tracking-tight" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {data.title}
            </h2>
            <p className="text-[14px] text-[#8A8899] leading-relaxed">{data.description}</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-left">
            {data.features.map((f) => (
              <div key={f} className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111113] border border-[#2A2A35]">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: data.color }} />
                <span className="text-[12px] text-[#8A8899]">{f}</span>
              </div>
            ))}
          </div>

          {/* AI Badge */}
          <div className="flex items-center justify-center gap-2 ai-badge px-4 py-2 rounded-full text-[12px] font-medium w-fit mx-auto">
            <Zap size={13} fill="currentColor" />
            AI-powered · India-first design logic
          </div>

          {/* CTA */}
          <button className="btn-gold px-8 py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 mx-auto">
            {data.action}
            <ChevronRight size={15} />
          </button>

          <p className="text-[11px] text-[#3A3A48]">This module is part of the StudioOS design operating system. Full build coming soon.</p>
        </div>
      </div>
    </div>
  );
}

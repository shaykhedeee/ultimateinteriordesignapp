import { Bell, Search, Plus, Zap } from 'lucide-react';

const screenTitles: Record<string, { title: string; subtitle: string }> = {
  command: { title: 'Command Center', subtitle: 'Studio overview & live activity' },
  leads: { title: 'Leads & CRM', subtitle: 'Client pipeline & qualification' },
  onboarding: { title: 'Discovery Wizard', subtitle: 'Client onboarding & design brief' },
  'site-capture': { title: 'Site Capture', subtitle: 'Measurements, scans & uploads' },
  'floor-plan': { title: 'Floor Plan Intelligence', subtitle: 'AI extraction & spatial review' },
  'design-studio': { title: 'Design Studio', subtitle: '2D / 3D parametric editor' },
  'render-studio': { title: 'Render Studio', subtitle: 'Photoreal renders & walkthroughs' },
  drawings: { title: 'Drawings & Elevations', subtitle: 'Auto-generated room documentation' },
  materials: { title: 'Materials & Budget', subtitle: 'Catalog, finishes & cost planning' },
  proposal: { title: 'Proposal & Brief', subtitle: 'Client-ready PDF generation' },
  approval: { title: 'Approval & Revisions', subtitle: 'Version-locked approvals' },
  production: { title: 'Production / BOM', subtitle: 'Cutlists, schedules & handoff' },
  deliverables: { title: 'Deliverables Vault', subtitle: 'All versioned project assets' },
  settings: { title: 'Settings & Rules', subtitle: 'Studio config & rule engine' },
};

interface TopbarProps {
  screen: string;
  onNewProject?: () => void;
}

export default function Topbar({ screen, onNewProject }: TopbarProps) {
  const meta = screenTitles[screen] || { title: 'StudioOS', subtitle: '' };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#2A2A35] bg-[#0D0D10] shrink-0">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-[14px] font-semibold text-[#F0EEE8] leading-tight">{meta.title}</h1>
          <p className="text-[11px] text-[#555566] leading-tight mt-0.5">{meta.subtitle}</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E1E24] border border-[#2A2A35] hover:border-[#3A3A48] transition-colors cursor-pointer">
          <Search size={13} className="text-[#555566]" />
          <span className="text-[12px] text-[#555566]">Search projects...</span>
          <kbd className="ml-2 text-[10px] text-[#3A3A48] bg-[#252530] px-1.5 py-0.5 rounded border border-[#3A3A48]">⌘K</kbd>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ai-badge text-[11px] font-medium cursor-pointer">
          <Zap size={11} fill="currentColor" />
          <span>AI Ready</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-[#1E1E24] transition-colors">
          <Bell size={15} className="text-[#8A8899]" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
        </button>

        {/* New Project */}
        <button
          onClick={onNewProject}
          className="btn-gold flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
        >
          <Plus size={13} strokeWidth={2.5} />
          New Project
        </button>
      </div>
    </header>
  );
}

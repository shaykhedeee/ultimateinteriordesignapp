import React from 'react';
import {
  LayoutDashboard, Users, ClipboardList, Scan,
  Box, Sparkles, FileImage, BookOpen, CheckSquare, Factory,
  Archive, Settings, ChevronRight, Zap, PenTool
} from 'lucide-react';

export type Screen =
  | 'command'
  | 'leads'
  | 'onboarding'
  | 'site-capture'
  | 'floor-plan'
  | 'design-studio'
  | 'render-studio'
  | 'drawings'
  | 'materials'
  | 'proposal'
  | 'approval'
  | 'production'
  | 'deliverables'
  | 'settings';

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeType?: 'gold' | 'blue' | 'teal' | 'rose';
  section?: string;
}

const navItems: NavItem[] = [
  { id: 'command', label: 'Command Center', icon: <LayoutDashboard size={16} />, section: 'WORKSPACE' },
  { id: 'leads', label: 'Leads & CRM', icon: <Users size={16} />, badge: 3, badgeType: 'gold' },
  { id: 'onboarding', label: 'Discovery', icon: <ClipboardList size={16} />, badge: 2, badgeType: 'blue' },
  { id: 'site-capture', label: 'Site Capture', icon: <Scan size={16} /> },
  { id: 'floor-plan', label: 'Floor Plan AI', icon: <PenTool size={16} />, badge: 'AI', badgeType: 'blue', section: 'INTELLIGENCE' },
  { id: 'design-studio', label: 'Design Studio', icon: <Box size={16} /> },
  { id: 'render-studio', label: 'Render Studio', icon: <Sparkles size={16} /> },
  { id: 'drawings', label: 'Drawings & Elevations', icon: <FileImage size={16} /> },
  { id: 'materials', label: 'Materials & Budget', icon: <BookOpen size={16} />, section: 'DELIVERY' },
  { id: 'proposal', label: 'Proposal & Brief', icon: <ClipboardList size={16} /> },
  { id: 'approval', label: 'Approval & Revisions', icon: <CheckSquare size={16} />, badge: 1, badgeType: 'rose' },
  { id: 'production', label: 'Production / BOM', icon: <Factory size={16} /> },
  { id: 'deliverables', label: 'Deliverables Vault', icon: <Archive size={16} /> },
  { id: 'settings', label: 'Settings & Rules', icon: <Settings size={16} />, section: 'STUDIO' },
];

const badgeColors: Record<string, string> = {
  gold: 'bg-[#C9A84C22] text-[#C9A84C] border border-[#C9A84C44]',
  blue: 'bg-[#4A7CFF22] text-[#4A7CFF] border border-[#4A7CFF44]',
  teal: 'bg-[#2DD4BF22] text-[#2DD4BF] border border-[#2DD4BF44]',
  rose: 'bg-[#F43F5E22] text-[#F43F5E] border border-[#F43F5E44]',
};

interface SidebarProps {
  active: Screen;
  onNavigate: (s: Screen) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="flex flex-col w-[220px] min-w-[220px] h-full border-r border-[#2A2A35] bg-[#0D0D10]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1E1E24]">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6F35)' }}>
          <Zap size={14} className="text-black" fill="black" />
        </div>
        <div>
          <div className="text-[13px] font-semibold tracking-wide text-[#F0EEE8]">StudioOS</div>
          <div className="text-[10px] text-[#555566] font-medium tracking-widest uppercase">Interior AI</div>
        </div>
      </div>

      {/* Studio Selector */}
      <div className="mx-3 mt-3 mb-2 px-3 py-2 rounded-lg bg-[#1E1E24] border border-[#2A2A35] cursor-pointer hover:border-[#3A3A48] transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#555566] font-medium uppercase tracking-widest">Studio</div>
            <div className="text-[12px] text-[#F0EEE8] font-medium mt-0.5">Arya Interiors</div>
          </div>
          <ChevronRight size={12} className="text-[#555566]" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <React.Fragment key={item.id}>
              {item.section && (
                <div className="pt-4 pb-1.5 px-2">
                  <span className="text-[9px] font-bold tracking-[0.15em] text-[#3A3A48] uppercase">{item.section}</span>
                </div>
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className={`nav-item relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 group ${
                  isActive
                    ? 'sidebar-item-active text-[#E8C97A]'
                    : 'text-[#8A8899] hover:text-[#F0EEE8] hover:bg-[#1E1E24]'
                }`}
              >
                <span className={isActive ? 'text-[#C9A84C]' : 'text-[#555566] group-hover:text-[#8A8899]'}>
                  {item.icon}
                </span>
                <span className="flex-1 text-[12.5px] font-medium">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`tag text-[10px] px-1.5 py-0.5 rounded ${badgeColors[item.badgeType || 'gold']}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Bottom User */}
      <div className="px-3 py-3 border-t border-[#1E1E24]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#1E1E24] cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-[#0A0A0B]"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}>
            SA
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-[#F0EEE8] truncate">Sneha Arya</div>
            <div className="text-[10px] text-[#555566]">Studio Owner</div>
          </div>
          <ChevronRight size={11} className="text-[#3A3A48]" />
        </div>
      </div>
    </aside>
  );
}

import Link from 'next/link';

const nav = [
  ['Command Center', '/command-center'],
  ['Leads', '/leads'],
  ['Projects', '/projects'],
  ['Onboarding', '/onboarding'],
  ['Site Capture', '/site-capture'],
  ['Plan Review', '/plan-review'],
  ['Design Studio', '/design-studio'],
  ['Scene Compare', '/scene-compare'],
  ['Render Studio', '/render-studio'],
  ['Drawings', '/drawings'],
  ['Materials & Budget', '/materials-budget'],
  ['Furniture Catalog', '/furniture-catalog'],
  ['Finance', '/finance'],
  ['Activity Timeline', '/timeline'],
  ['Jobs Monitor', '/jobs'],
  ['Agentic Inbox', '/inbox'],
  ['Proposal', '/proposal'],
  ['Approvals', '/approvals'],
  ['Production', '/production'],
  ['Deliverables', '/deliverables'],
  ['Settings', '/settings'],
] as const;

export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="sidebar">
      <div style={{ fontWeight: 800, marginBottom: 16 }}>StudioOS</div>
      <div className="navList">
        {nav.map(([label, href]) => (
          <Link key={href} href={href} className={`navItem ${pathname === href ? 'active' : ''}`}>
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

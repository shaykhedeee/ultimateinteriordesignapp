'use client';

import Link from 'next/link';

type NavItem = readonly [string, string];

type NavSection = {
  readonly title: string;
  readonly items: readonly NavItem[];
};

const sections: readonly NavSection[] = [
  {
    title: 'Intake & Discovery',
    items: [
      ['Command Center', '/command-center'],
      ['Leads', '/leads'],
      ['Onboarding', '/onboarding'],
      ['Site Capture', '/site-capture'],
    ],
  },
  {
    title: 'CAD & Design Studio',
    items: [
      ['Plan Review', '/plan-review'],
      ['Design Studio', '/design-studio'],
      ['Scene Compare', '/scene-compare'],
      ['Render Studio', '/render-studio'],
      ['Drawings', '/drawings'],
      ['Furniture Catalog', '/furniture-catalog'],
    ],
  },
  {
    title: 'Execution & Finance',
    items: [
      ['Materials & Budget', '/materials-budget'],
      ['Proposal', '/proposal'],
      ['Approvals', '/approvals'],
      ['Production', '/production'],
      ['Deliverables', '/deliverables'],
      ['Finance', '/finance'],
    ],
  },
  {
    title: 'Operations & Systems',
    items: [
      ['Activity Timeline', '/timeline'],
      ['Jobs Monitor', '/jobs'],
      ['Agentic Inbox', '/inbox'],
      ['Settings', '/settings'],
    ],
  },
];

export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="sidebar" role="navigation" aria-label="Sidebar Navigation">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)', letterSpacing: '-0.02em' }}>StudioOS</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: 'rgba(201,168,76,0.12)', color: 'var(--gold)' }}>PRO</span>
      </div>
      <div className="navList">
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 12 }}>
            <div className="navSectionHeader">{section.title}</div>
            {section.items.map(([label, href]) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href as any}
                  className={`navItem ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}

'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { RightRail } from './RightRail';

export function StudioShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell" role="presentation">
      <Sidebar pathname={pathname} />
      <div className="mainArea" role="presentation">
        <Topbar title={title} />
        <main className="content" role="main" aria-label="Main Content Workspace">
          {children}
        </main>
      </div>
      <div role="complementary" aria-label="Readiness & Recent Activity Rail">
        <RightRail />
      </div>
    </div>
  );
}

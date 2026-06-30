'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { RightRail } from './RightRail';

export function StudioShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <Sidebar pathname={pathname} />
      <div className="mainArea">
        <Topbar title={title} />
        <main className="content">{children}</main>
      </div>
      <RightRail />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { PartnerSidebar } from './partner-sidebar';
import { Header } from './header';

interface PartnerLayoutProps {
  children: React.ReactNode;
  userName: string | null;
  userRole: string;
}

export function PartnerLayout({ children, userName, userRole }: PartnerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <PartnerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

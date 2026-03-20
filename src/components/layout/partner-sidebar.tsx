'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dự án', href: '/partner/projects', icon: FolderKanban },
  { label: 'Tài liệu', href: '/partner/documents', icon: FileText },
];

interface PartnerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PartnerSidebar({ isOpen, onClose }: PartnerSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 lg:hidden">
          <span className="text-lg font-bold text-gray-900">ProjectOpsOS</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logo — desktop only */}
        <div className="hidden h-16 items-center border-b border-gray-200 px-4 lg:flex">
          <Link href="/partner/projects" className="text-lg font-bold text-gray-900">
            ProjectOpsOS
          </Link>
          <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Đối tác
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

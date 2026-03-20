'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ArrowRightLeft,
  FileText,
  DollarSign,
  ScrollText,
  Bell,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When set, the item is only visible for these roles. */
  roles?: string[];
}

const NAV_MAIN: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Dự án', href: '/dashboard/projects', icon: FolderKanban },
  { label: 'Bàn giao', href: '/dashboard/handovers', icon: ArrowRightLeft },
  { label: 'Tài liệu', href: '/dashboard/documents', icon: FileText },
  { label: 'Công việc', href: '/dashboard/tasks', icon: CheckSquare },
];

const NAV_MANAGEMENT: NavItem[] = [
  {
    label: 'Tài chính',
    href: '/dashboard/finance',
    icon: DollarSign,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Nhật ký',
    href: '/dashboard/audit-logs',
    icon: ScrollText,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Thông báo',
    href: '/dashboard/notifications',
    icon: Bell,
  },
];

const NAV_SETTINGS: NavItem[] = [
  { label: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  function isVisible(item: NavItem): boolean {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  }

  function renderItems(items: NavItem[]) {
    return items.filter(isVisible).map((item) => {
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
    });
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
          <Link href="/dashboard" className="text-lg font-bold text-gray-900">
            ProjectOpsOS
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {renderItems(NAV_MAIN)}

          {/* Separator — only if management items visible */}
          {NAV_MANAGEMENT.some(isVisible) && (
            <div className="my-3 border-t border-gray-200" />
          )}
          {renderItems(NAV_MANAGEMENT)}

          <div className="my-3 border-t border-gray-200" />
          {renderItems(NAV_SETTINGS)}
        </nav>
      </aside>
    </>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

/** Role label mapping for Vietnamese display. */
const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  lead: 'Trưởng nhóm',
  member: 'Thành viên',
  viewer: 'Người xem',
};

interface HeaderProps {
  userName: string | null;
  userRole: string;
  onMenuToggle: () => void;
}

export function Header({ userName, userRole, onMenuToggle }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = userName ?? 'Người dùng';
  const roleLabel = ROLE_LABELS[userRole] ?? userRole;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Left: hamburger + app name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/dashboard"
          className="hidden text-lg font-bold text-gray-900 sm:block lg:hidden"
        >
          ProjectOpsOS
        </Link>
      </div>

      {/* Right: notification + user */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Link
          href="/dashboard/notifications"
          className="relative rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          {/* Unread badge — placeholder count */}
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:block">{displayName}</span>
            <ChevronDown className="hidden h-4 w-4 sm:block" />
          </button>

          {/* Dropdown menu */}
          <div
            className={cn(
              'absolute right-0 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg transition-all',
              isDropdownOpen
                ? 'visible scale-100 opacity-100'
                : 'invisible scale-95 opacity-0',
            )}
          >
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <User className="h-4 w-4" />
              Hồ sơ cá nhân
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

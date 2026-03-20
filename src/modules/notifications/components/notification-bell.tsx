'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { POLL_INTERVAL_MS } from '../constants';
import type { UnreadCount } from '../types';

interface NotificationBellProps {
  initialUnreadCount: UnreadCount;
  fetchUnreadCount: () => Promise<UnreadCount>;
}

export function NotificationBell({
  initialUnreadCount,
  fetchUnreadCount,
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<UnreadCount>(initialUnreadCount);

  // SWR-style polling: refetch unread count on interval
  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const count = await fetchUnreadCount();
        if (mounted) {
          setUnreadCount(count);
        }
      } catch {
        // Silently ignore polling errors — bell is non-critical
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  const total = unreadCount.total;
  const hasUrgent = unreadCount.urgent > 0;

  return (
    <Link
      href="/dashboard/notifications"
      className="relative inline-flex items-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      aria-label={total > 0 ? `${total} thông báo chưa đọc` : 'Thông báo'}
    >
      <Bell className="h-5 w-5" />
      {total > 0 && (
        <span
          className={cn(
            'absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1',
            'text-xs font-bold text-white',
            hasUrgent ? 'bg-red-500' : 'bg-blue-500',
          )}
        >
          {total > 99 ? '99+' : total}
        </span>
      )}
    </Link>
  );
}

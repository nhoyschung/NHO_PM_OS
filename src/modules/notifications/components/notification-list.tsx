'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NOTIFICATION_TYPE_LABELS, DEFAULT_PER_PAGE } from '../constants';
import { markAllAsRead } from '../actions';
import { NotificationItem } from './notification-item';
import type { NotificationListItem, NotificationType, NotificationPriority } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface NotificationListProps {
  data: NotificationListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: {
    type?: string;
    isRead?: boolean;
  };
  unreadCount: number;
}

// ── Filter options ────────────────────────────────────────────────

const TYPE_OPTIONS: Array<{ value: NotificationType; label: string }> = (
  Object.entries(NOTIFICATION_TYPE_LABELS) as Array<[NotificationType, string]>
).map(([value, label]) => ({ value, label }));

// ── Component ─────────────────────────────────────────────────────

export function NotificationList({
  data,
  total,
  page,
  perPage,
  totalPages,
  filters,
  unreadCount,
}: NotificationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      startTransition(() => {
        router.push(`/dashboard/notifications?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  function handleTypeFilter(value: string) {
    updateParams({ type: value || undefined, page: '1' });
  }

  function handleReadFilter(value: string) {
    updateParams({ isRead: value || undefined, page: '1' });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead({});
      router.refresh();
    });
  }

  function handlePageChange(newPage: number) {
    updateParams({ page: String(newPage) });
  }

  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
              {unreadCount} chưa đọc
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.type ?? ''}
          onChange={(e) => handleTypeFilter(e.target.value)}
          className={cn(
            'rounded-md border border-gray-300 px-3 py-1.5 text-sm',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          )}
        >
          <option value="">Tất cả loại</option>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.isRead === undefined ? '' : String(filters.isRead)}
          onChange={(e) => handleReadFilter(e.target.value)}
          className={cn(
            'rounded-md border border-gray-300 px-3 py-1.5 text-sm',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          )}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="false">Chưa đọc</option>
          <option value="true">Đã đọc</option>
        </select>
      </div>

      {/* Notification list */}
      <div className={cn('space-y-2', isPending && 'opacity-60')}>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
            <Bell className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Không có thông báo mới.</p>
          </div>
        ) : (
          data.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onUpdate={() => router.refresh()}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            Hiển thị {start}–{end} trên {total} mục
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page <= 1 || isPending}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isPending}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isPending}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page >= totalPages || isPending}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

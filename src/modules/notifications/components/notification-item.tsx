'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_COLORS } from '../constants';
import { markAsRead, deleteNotification } from '../actions';
import type { NotificationListItem } from '../types';

interface NotificationItemProps {
  notification: NotificationListItem;
  onUpdate?: () => void;
}

export function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const [isPending, startTransition] = useTransition();
  const colors = NOTIFICATION_TYPE_COLORS[notification.type];
  const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type];

  function handleMarkRead() {
    startTransition(async () => {
      await markAsRead({ notificationId: notification.id });
      onUpdate?.();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteNotification({ notificationId: notification.id });
      onUpdate?.();
    });
  }

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-colors',
        notification.isRead
          ? 'border-gray-200 bg-white'
          : 'border-blue-200 bg-blue-50',
        isPending && 'opacity-50',
      )}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
      )}
      {notification.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0" />}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              colors.bg,
              colors.text,
            )}
          >
            {typeLabel}
          </span>
          <span className="text-xs text-gray-400">
            {new Intl.DateTimeFormat('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(notification.createdAt))}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-gray-900">{notification.title}</p>
        <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">{notification.message}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {!notification.isRead && (
          <button
            onClick={handleMarkRead}
            disabled={isPending}
            className="rounded p-1 text-xs text-blue-600 hover:bg-blue-100 disabled:opacity-50"
            title="Đánh dấu đã đọc"
          >
            Đọc
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
          title="Xóa thông báo"
        >
          Xóa
        </button>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

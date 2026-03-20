'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  ENTITY_TYPE_LABELS,
  ENTITY_ROUTE_MAP,
} from '@/modules/audit-logs/constants';
import type { AuditLogListItem } from '@/modules/audit-logs/types';
import type { AuditAction, AuditEntityType } from '@/modules/audit-logs/types';

// ── Relative Time Formatter ─────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

// ── Recent Activity Component ───────────────────────────────────

interface RecentActivityProps {
  activities: AuditLogListItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Hoạt động gần đây</h3>
        <p className="text-sm text-gray-500 mt-3">
          Chưa có nhật ký nào.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-base font-semibold text-gray-900">Hoạt động gần đây</h3>
        <Link
          href="/dashboard/audit-log"
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Xem tất cả
        </Link>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => {
          const actionColors = AUDIT_ACTION_COLORS[activity.action as AuditAction];
          const actionLabel = AUDIT_ACTION_LABELS[activity.action as AuditAction] ?? activity.action;
          const entityLabel = ENTITY_TYPE_LABELS[activity.entityType as AuditEntityType] ?? activity.entityType;
          const entityRoute = ENTITY_ROUTE_MAP[activity.entityType as AuditEntityType];

          return (
            <div key={activity.id} className="flex items-start gap-3">
              {/* Timeline dot */}
              <div className="mt-1.5 h-2 w-2 rounded-full bg-gray-300 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium',
                      actionColors?.bg ?? 'bg-gray-100',
                      actionColors?.text ?? 'text-gray-800',
                    )}
                  >
                    {actionLabel}
                  </span>
                  <span className="text-xs text-gray-500">
                    {entityLabel}
                  </span>
                </div>

                <div className="mt-0.5">
                  {activity.entityName && entityRoute && activity.entityId ? (
                    <Link
                      href={`${entityRoute}/${activity.entityId}`}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      {activity.entityName}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">
                      {activity.entityName ?? activity.description ?? '-'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 truncate">
                    {activity.userEmail ?? 'Hệ thống'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

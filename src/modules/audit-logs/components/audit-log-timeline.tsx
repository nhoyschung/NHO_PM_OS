'use client';

import { ClipboardList } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  ENTITY_TYPE_LABELS,
  SEVERITY_COLORS,
} from '../constants';
import { ActionBadge } from './action-badge';
import type { AuditLogListItem } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface AuditLogTimelineProps {
  entries: AuditLogListItem[];
  emptyMessage?: string;
}

// ── Component ─────────────────────────────────────────────────────
// Timeline view for entity detail tabs (projects, handovers, etc.)

export function AuditLogTimeline({
  entries,
  emptyMessage = 'Chưa có nhật ký hoạt động nào.',
}: AuditLogTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-8">
        <ClipboardList className="h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {entries.map((entry, idx) => (
          <li key={entry.id}>
            <div className="relative pb-8">
              {/* Connector line */}
              {idx < entries.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                {/* Icon bubble */}
                <div
                  className={cn(
                    'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                    SEVERITY_COLORS[entry.severity].bg,
                  )}
                >
                  <ClipboardList
                    className={cn('h-4 w-4', SEVERITY_COLORS[entry.severity].text)}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionBadge action={entry.action} />
                    <span className="text-sm text-gray-600">
                      {ENTITY_TYPE_LABELS[entry.entityType]}
                      {entry.entityName && (
                        <span className="ml-1 font-medium text-gray-800">
                          {entry.entityName}
                        </span>
                      )}
                    </span>
                  </div>

                  {entry.description && (
                    <p className="mt-0.5 text-sm text-gray-500">{entry.description}</p>
                  )}

                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-400">
                    <span>{formatDate(entry.createdAt)}</span>
                    {entry.userEmail && <span>bởi {entry.userEmail}</span>}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

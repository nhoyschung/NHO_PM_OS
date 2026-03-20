'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  ENTITY_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from '../constants';
import { ActionBadge } from './action-badge';
import { SeverityBadge } from './severity-badge';
import type { AuditLogListItem, AuditAction, AuditEntityType, AuditSeverity } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface AuditLogListProps {
  data: AuditLogListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: {
    search?: string;
    action?: string;
    entityType?: string;
    severity?: string;
  };
}

// ── Filter options ────────────────────────────────────────────────

const ACTION_OPTIONS: Array<{ value: AuditAction; label: string }> = (
  Object.entries(AUDIT_ACTION_LABELS) as Array<[AuditAction, string]>
).map(([value, label]) => ({ value, label }));

const ENTITY_TYPE_OPTIONS: Array<{ value: AuditEntityType; label: string }> = (
  Object.entries(ENTITY_TYPE_LABELS) as Array<[AuditEntityType, string]>
).map(([value, label]) => ({ value, label }));

const SEVERITY_OPTIONS: Array<{ value: AuditSeverity; label: string }> = (
  Object.entries(SEVERITY_LABELS) as Array<[AuditSeverity, string]>
).map(([value, label]) => ({ value, label }));

// ── Component ─────────────────────────────────────────────────────

export function AuditLogList({
  data,
  total,
  page,
  perPage,
  totalPages,
  filters,
}: AuditLogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      if (!('page' in updates)) {
        params.delete('page');
      }
      startTransition(() => {
        router.push(`/dashboard/audit-logs?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const handleSearch = useCallback(
    (value: string) => {
      updateParams({ search: value || undefined });
    },
    [updateParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams({ page: String(newPage) });
    },
    [updateParams],
  );

  const startIndex = (page - 1) * perPage + 1;
  const endIndex = Math.min(page * perPage, total);

  return (
    <div className="space-y-4">
      {/* Header — read-only, no create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký kiểm toán</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lịch sử hoạt động hệ thống (chỉ xem — không thể chỉnh sửa)
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, mô tả..."
            defaultValue={filters.search ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Action filter */}
        <select
          value={filters.action ?? ''}
          onChange={(e) => updateParams({ action: e.target.value || undefined })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Hành động</option>
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Entity type filter */}
        <select
          value={filters.entityType ?? ''}
          onChange={(e) => updateParams({ entityType: e.target.value || undefined })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Loại thực thể</option>
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Severity filter */}
        <select
          value={filters.severity ?? ''}
          onChange={(e) => updateParams({ severity: e.target.value || undefined })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Mức độ</option>
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading overlay */}
      <div className={cn('relative', isPending && 'opacity-60 pointer-events-none')}>
        {/* Results count */}
        <div className="mb-2 text-sm text-gray-500">
          {total > 0 ? (
            <>
              Hiển thị {startIndex}–{endIndex} trên {total} bản ghi
            </>
          ) : (
            'Không có dữ liệu'
          )}
        </div>

        {/* Table */}
        {data.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Hành động
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Thực thể
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Người dùng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Mức độ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Mô tả
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          {ENTITY_TYPE_LABELS[log.entityType]}
                        </span>
                        {log.entityName && (
                          <span className="text-xs text-gray-500">— {log.entityName}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-700">{log.userEmail ?? '—'}</p>
                        {log.userRole && (
                          <p className="text-xs text-gray-500">{log.userRole}</p>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <SeverityBadge severity={log.severity} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[240px] truncate">
                      {log.description ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12">
            <ClipboardList className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              Chưa có nhật ký nào
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Các hoạt động trong hệ thống sẽ được ghi lại tại đây.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-gray-500">
              Trang {page} trên {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Trang đầu"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trang trước</span>
              </button>
              {generatePageNumbers(page, totalPages).map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-sm text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p as number)}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-sm font-medium',
                      p === page
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Trang sau"
              >
                <span className="hidden sm:inline">Trang sau</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Trang cuối"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper: generate page number array with ellipsis ──────────────

function generatePageNumbers(
  current: number,
  total: number,
): Array<number | '...'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | '...'> = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);
  return pages;
}

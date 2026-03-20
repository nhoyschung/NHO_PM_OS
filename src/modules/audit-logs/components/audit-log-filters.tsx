'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AUDIT_ACTION_LABELS,
  ENTITY_TYPE_LABELS,
  SEVERITY_LABELS,
} from '../constants';
import type { AuditAction, AuditEntityType, AuditSeverity, AuditLogFilters } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface AuditLogFiltersProps {
  filters: Partial<AuditLogFilters>;
  basePath?: string;
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

export function AuditLogFilters({
  filters,
  basePath = '/dashboard/audit-logs',
}: AuditLogFiltersProps) {
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
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition, basePath],
  );

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      router.push(basePath);
    });
  }, [router, startTransition, basePath]);

  const hasActiveFilters = Boolean(
    filters.search || filters.action || filters.entityType || filters.severity ||
    filters.userId || filters.projectId || filters.dateFrom || filters.dateTo,
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4',
        'sm:flex-row sm:flex-wrap sm:items-center',
        isPending && 'opacity-60 pointer-events-none',
      )}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, mô tả..."
          defaultValue={filters.search ?? ''}
          onChange={(e) => updateParams({ search: e.target.value || undefined })}
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* Date from */}
      <input
        type="date"
        value={filters.dateFrom ?? ''}
        onChange={(e) => updateParams({ dateFrom: e.target.value || undefined })}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Từ ngày"
      />

      {/* Date to */}
      <input
        type="date"
        value={filters.dateTo ?? ''}
        onChange={(e) => updateParams({ dateTo: e.target.value || undefined })}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Đến ngày"
      />

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" />
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}

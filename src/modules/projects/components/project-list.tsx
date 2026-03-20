'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  STAGE_LABELS,
  PRIORITY_LABELS,
  HEALTH_LABELS,
  DEFAULT_PER_PAGE,
} from '../constants';
import { StageBadge } from './stage-badge';
import { PriorityBadge } from './priority-badge';
import { HealthBadge } from './health-badge';
import type { ProjectListItem, ProjectStage, ProjectPriority, HealthStatus } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface ProjectListProps {
  data: ProjectListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: {
    search?: string;
    stage?: string;
    priority?: string;
    healthStatus?: string;
  };
}

// ── Filter options ────────────────────────────────────────────────

const STAGE_OPTIONS: Array<{ value: ProjectStage; label: string }> = (
  Object.entries(STAGE_LABELS) as Array<[ProjectStage, string]>
).map(([value, label]) => ({ value, label }));

const PRIORITY_OPTIONS: Array<{ value: ProjectPriority; label: string }> = (
  Object.entries(PRIORITY_LABELS) as Array<[ProjectPriority, string]>
).map(([value, label]) => ({ value, label }));

const HEALTH_OPTIONS: Array<{ value: HealthStatus; label: string }> = (
  Object.entries(HEALTH_LABELS) as Array<[HealthStatus, string]>
).map(([value, label]) => ({ value, label }));

// ── Component ─────────────────────────────────────────────────────

export function ProjectList({
  data,
  total,
  page,
  perPage,
  totalPages,
  filters,
}: ProjectListProps) {
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
      // Reset page to 1 when filters change (unless we're changing page itself)
      if (!('page' in updates)) {
        params.delete('page');
      }
      startTransition(() => {
        router.push(`/dashboard/projects?${params.toString()}`);
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách dự án</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tất cả các dự án trong hệ thống
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Tạo dự án mới
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dự án..."
            defaultValue={filters.search ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Stage filter */}
        <select
          value={filters.stage ?? ''}
          onChange={(e) => updateParams({ stage: e.target.value || undefined })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Giai đoạn</option>
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filters.priority ?? ''}
          onChange={(e) => updateParams({ priority: e.target.value || undefined })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Ưu tiên</option>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Health filter */}
        <select
          value={filters.healthStatus ?? ''}
          onChange={(e) => updateParams({ healthStatus: e.target.value || undefined })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Tình trạng</option>
          {HEALTH_OPTIONS.map((opt) => (
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
              Hiển thị {startIndex}–{endIndex} trên {total} dự án
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
                    Tên dự án
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Mã dự án
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Giai đoạn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ưu tiên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Người phụ trách
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((project) => (
                  <tr
                    key={project.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/dashboard/projects/${project.slug}`)}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50">
                          <FolderKanban className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {project.name}
                          </p>
                          {project.province && (
                            <p className="text-xs text-gray-500">{project.province}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {project.code}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StageBadge stage={project.stage} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <PriorityBadge priority={project.priority} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {project.managerName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatDate(project.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12">
            <FolderKanban className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              Chưa có dự án nào
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Tạo dự án đầu tiên để bắt đầu.
            </p>
            <Link
              href="/dashboard/projects/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tạo dự án mới
            </Link>
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

              {/* Page numbers */}
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

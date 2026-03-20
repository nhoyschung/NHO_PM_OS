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
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
} from '../constants';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import type { TaskListItem, TaskStatus, TaskPriority, TaskType } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface TaskListProps {
  data: TaskListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: {
    search?: string;
    status?: string;
    priority?: string;
    type?: string;
  };
}

// ── Filter options ────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = (
  Object.entries(TASK_STATUS_LABELS) as Array<[TaskStatus, string]>
).map(([value, label]) => ({ value, label }));

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = (
  Object.entries(TASK_PRIORITY_LABELS) as Array<[TaskPriority, string]>
).map(([value, label]) => ({ value, label }));

const TYPE_OPTIONS: Array<{ value: TaskType; label: string }> = (
  Object.entries(TASK_TYPE_LABELS) as Array<[TaskType, string]>
).map(([value, label]) => ({ value, label }));

// ── Component ─────────────────────────────────────────────────────

export function TaskList({
  data,
  total,
  page,
  perPage,
  totalPages,
  filters,
}: TaskListProps) {
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
        router.push(`/dashboard/tasks?${params.toString()}`);
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

  const isOverdue = (task: TaskListItem): boolean => {
    if (!task.dueDate) return false;
    if (task.status === 'done' || task.status === 'cancelled') return false;
    return task.dueDate < new Date().toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Công việc</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tất cả công việc trong hệ thống
          </p>
        </div>
        <Link
          href="/dashboard/tasks/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Tạo công việc
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm công việc..."
            defaultValue={filters.search ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Trạng thái</option>
          {STATUS_OPTIONS.map((opt) => (
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

        {/* Type filter */}
        <select
          value={filters.type ?? ''}
          onChange={(e) => updateParams({ type: e.target.value || undefined })}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Loại</option>
          {TYPE_OPTIONS.map((opt) => (
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
              Hiển thị {startIndex}–{endIndex} trên {total} công việc
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
                    Công việc
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Mã
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ưu tiên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Người được giao
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Hạn chót
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Dự án
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        overdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50',
                      )}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 flex-shrink-0">
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500">{TASK_TYPE_LABELS[task.type]}</p>
                          </div>
                          {overdue && (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {task.code}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <TaskPriorityBadge priority={task.priority} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {task.assigneeName ?? '—'}
                      </td>
                      <td
                        className={cn(
                          'whitespace-nowrap px-4 py-3 text-sm',
                          overdue ? 'font-medium text-red-600' : 'text-gray-500',
                        )}
                      >
                        {task.dueDate ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {task.projectCode ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12">
            <CheckSquare className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">Chưa có công việc nào</h3>
            <p className="mt-1 text-sm text-gray-500">Tạo công việc đầu tiên để bắt đầu.</p>
            <Link
              href="/dashboard/tasks/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tạo công việc
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

// ── Helper ────────────────────────────────────────────────────────

function generatePageNumbers(current: number, total: number): Array<number | '...'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | '...'> = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

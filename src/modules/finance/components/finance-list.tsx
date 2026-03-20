'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FINANCE_TYPE_LABELS,
  FINANCE_STATUS_LABELS,
  FINANCE_STATUS_COLORS,
  FINANCE_CATEGORY_LABELS,
  isIncomeType,
  FINANCE_CLASS_COLORS,
} from '../constants';
import type { FinanceListItem, FinancialType, FinancialStatus } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface FinanceListProps {
  data: FinanceListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: {
    search?: string;
    type?: string;
    status?: string;
  };
}

// ── Status Badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: FinancialStatus }) {
  const colors = FINANCE_STATUS_COLORS[status];
  const label = FINANCE_STATUS_LABELS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
      )}
    >
      {label}
    </span>
  );
}

// ── Type Badge (Thu / Chi) ────────────────────────────────────────

function TypeBadge({ type }: { type: FinancialType }) {
  const isIncome = isIncomeType(type);
  const colors = isIncome ? FINANCE_CLASS_COLORS.income : FINANCE_CLASS_COLORS.expense;
  const classLabel = isIncome ? 'Thu' : 'Chi';
  const typeLabel = FINANCE_TYPE_LABELS[type];
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold w-fit',
          colors.bg,
          colors.text,
        )}
      >
        {classLabel}
      </span>
      <span className="text-xs text-gray-500">{typeLabel}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export function FinanceList({
  data,
  total,
  page,
  perPage,
  totalPages,
  filters,
}: FinanceListProps) {
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
      startTransition(() => {
        router.push(`/finance?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const search = fd.get('search') as string;
      updateParams({ search: search || undefined, page: '1' });
    },
    [updateParams],
  );

  const TYPE_OPTIONS: Array<{ value: FinancialType; label: string }> = (
    Object.entries(FINANCE_TYPE_LABELS) as Array<[FinancialType, string]>
  ).map(([value, label]) => ({ value, label }));

  const STATUS_OPTIONS: Array<{ value: FinancialStatus; label: string }> = [
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
    { value: 'processed', label: 'Đã xử lý' },
  ];

  const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Tài chính</h1>
        </div>
        <Link
          href="/finance/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Thêm bản ghi
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="search"
              type="text"
              defaultValue={filters.search}
              placeholder="Tìm kiếm mô tả, mã tham chiếu..."
              className="rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Tìm
          </button>
        </form>

        {/* Type filter */}
        <select
          value={filters.type ?? ''}
          onChange={(e) => updateParams({ type: e.target.value || undefined, page: '1' })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả loại</option>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => updateParams({ status: e.target.value || undefined, page: '1' })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={cn('rounded-lg border border-gray-200 bg-white', isPending && 'opacity-60')}>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <DollarSign className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm">Chưa có bản ghi tài chính nào.</p>
            <Link
              href="/finance/new"
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Tạo bản ghi đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Loại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Danh mục</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Số tiền</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mô tả</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dự án</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày GD</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((record) => {
                  const isIncome = isIncomeType(record.type);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <TypeBadge type={record.type} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {FINANCE_CATEGORY_LABELS[record.category]}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right font-medium tabular-nums',
                          isIncome ? 'text-green-700' : 'text-red-700',
                        )}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/finance/${record.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline line-clamp-1"
                        >
                          {record.description}
                        </Link>
                        {record.referenceNumber && (
                          <p className="text-xs text-gray-500">#{record.referenceNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {record.projectName ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {record.transactionDate}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-600">
            Hiển thị {startItem}–{endItem} trên {total} mục
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateParams({ page: String(page - 1) })}
              disabled={page <= 1}
              className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => updateParams({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

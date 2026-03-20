'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
  File,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DEFAULT_PER_PAGE,
} from '../constants';
import { DocumentTypeBadge } from './document-type-badge';
import { DocumentStatusBadge } from './document-status-badge';
import type { DocumentListItem, DocumentType, DocumentStatus } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface DocumentListProps {
  data: DocumentListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: {
    search?: string;
    type?: string;
    status?: string;
    projectId?: string;
  };
}

// ── Filter options ────────────────────────────────────────────────

const TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = (
  Object.entries(DOCUMENT_TYPE_LABELS) as Array<[DocumentType, string]>
).map(([value, label]) => ({ value, label }));

const STATUS_OPTIONS: Array<{ value: DocumentStatus; label: string }> = (
  Object.entries(DOCUMENT_STATUS_LABELS) as Array<[DocumentStatus, string]>
).map(([value, label]) => ({ value, label }));

// ── Helpers ───────────────────────────────────────────────────────

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ─────────────────────────────────────────────────────

export function DocumentList({
  data,
  total,
  page,
  perPage,
  totalPages,
  filters,
}: DocumentListProps) {
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
        router.push(`/dashboard/documents?${params.toString()}`);
      });
    },
    [searchParams, router],
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateParams({ search: e.target.value || undefined, page: '1' });
    },
    [updateParams],
  );

  const handleTypeFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateParams({ type: e.target.value || undefined, page: '1' });
    },
    [updateParams],
  );

  const handleStatusFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateParams({ status: e.target.value || undefined, page: '1' });
    },
    [updateParams],
  );

  const goToPage = useCallback(
    (newPage: number) => {
      updateParams({ page: String(newPage) });
    },
    [updateParams],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tài liệu</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} tài liệu
          </p>
        </div>
        <Link
          href="/dashboard/documents/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tạo tài liệu
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            defaultValue={filters.search}
            onChange={handleSearch}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          defaultValue={filters.type ?? ''}
          onChange={handleTypeFilter}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả loại</option>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          defaultValue={filters.status ?? ''}
          onChange={handleStatusFilter}
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
      <div className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white', isPending && 'opacity-60')}>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">Chưa có tài liệu nào.</p>
            <Link
              href="/dashboard/documents/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tạo tài liệu đầu tiên
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tài liệu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Phiên bản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Người tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cập nhật
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <File className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      <div>
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {doc.title}
                        </Link>
                        {doc.description && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                            {doc.description}
                          </p>
                        )}
                        {doc.fileSize && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatFileSize(doc.fileSize)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <DocumentTypeBadge type={doc.type} />
                  </td>
                  <td className="px-6 py-4">
                    <DocumentStatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      v{doc.currentVersion}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {doc.projectName ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {doc.createdByName ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(doc.updatedAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-600">
            Hiển thị {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} trên {total} mục
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Tiếp
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

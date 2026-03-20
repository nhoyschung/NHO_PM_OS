'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  File,
  Clock,
  User,
  FolderKanban,
  GitBranch,
  Info,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
} from '../constants';
import { DocumentTypeBadge } from './document-type-badge';
import { DocumentStatusBadge } from './document-status-badge';
import { deleteDocument } from '../actions';
import type { ActionResult } from '@/lib/action';
import type { DocumentDetail as DocumentDetailType } from '../types';

// ── Type re-export for action callback ────────────────────────────

type VersionUploadCallback = (data: {
  documentId: string;
  changeSummary?: string;
  content?: string;
}) => Promise<ActionResult<{ versionNumber: number }>>;

// ── Props ─────────────────────────────────────────────────────────

interface DocumentDetailProps {
  document: DocumentDetailType;
  onUploadVersion: VersionUploadCallback;
}

// ── Helpers ───────────────────────────────────────────────────────

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Tab definition ────────────────────────────────────────────────

type TabKey = 'info' | 'versions' | 'content';

const TABS: Array<{ key: TabKey; label: string; icon: typeof Info }> = [
  { key: 'info', label: 'Thông tin', icon: Info },
  { key: 'versions', label: 'Lịch sử phiên bản', icon: GitBranch },
  { key: 'content', label: 'Nội dung', icon: File },
];

// ── Component ─────────────────────────────────────────────────────

export function DocumentDetail({ document, onUploadVersion }: DocumentDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [newChangeSummary, setNewChangeSummary] = useState('');

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDocument({ documentId: document.id });
      if (result.success) {
        router.push('/dashboard/documents');
      } else {
        setError(result.error);
        setShowDeleteConfirm(false);
      }
    });
  };

  const handleUploadVersion = () => {
    startTransition(async () => {
      const result = await onUploadVersion({
        documentId: document.id,
        changeSummary: newChangeSummary || undefined,
      });
      if (result.success) {
        setShowVersionForm(false);
        setNewChangeSummary('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <File className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DocumentTypeBadge type={document.type} />
              <DocumentStatusBadge status={document.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                <GitBranch className="h-3 w-3" />
                v{document.currentVersion}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVersionForm(true)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Phiên bản mới
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* New Version Form */}
      {showVersionForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <h3 className="text-sm font-medium text-blue-900">Tạo phiên bản mới (v{document.currentVersion + 1})</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tóm tắt thay đổi</label>
            <input
              type="text"
              value={newChangeSummary}
              onChange={(e) => setNewChangeSummary(e.target.value)}
              placeholder="Mô tả nội dung thay đổi..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUploadVersion}
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Đang xử lý...' : 'Tạo phiên bản'}
            </button>
            <button
              onClick={() => { setShowVersionForm(false); setNewChangeSummary(''); }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm text-red-800">
            Bạn có chắc muốn xóa tài liệu này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Main layout: tabs + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tabs content (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab nav */}
          <div className="flex border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: info */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {document.description && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Mô tả</h3>
                  <p className="text-sm text-gray-600">{document.description}</p>
                </div>
              )}
              <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Thông tin tệp</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Kích thước:</span>{' '}
                    <span className="text-gray-900">{formatFileSize(document.fileSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Định dạng:</span>{' '}
                    <span className="text-gray-900">{document.mimeType ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Đường dẫn:</span>{' '}
                    <span className="text-gray-900 break-all">{document.filePath ?? '—'}</span>
                  </div>
                </div>
              </div>
              {Array.isArray(document.tags) && (document.tags as string[]).length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Nhãn</h3>
                  <div className="flex flex-wrap gap-2">
                    {(document.tags as string[]).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: versions */}
          {activeTab === 'versions' && (
            <div className="space-y-2">
              {document.versions.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">Không có phiên bản nào.</p>
              ) : (
                document.versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 flex items-start gap-4"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      v{ver.versionNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {ver.changeSummary ?? 'Không có mô tả thay đổi'}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ver.createdByName ?? 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ver.createdAt)}
                        </span>
                        {ver.fileSize && (
                          <span>{formatFileSize(ver.fileSize)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: content */}
          {activeTab === 'content' && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {document.content ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {document.content}
                </pre>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Tài liệu này không có nội dung văn bản.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Chi tiết</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Loại</span>
                <DocumentTypeBadge type={document.type} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <DocumentStatusBadge status={document.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phiên bản</span>
                <span className="font-medium text-gray-900">v{document.currentVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tổng phiên bản</span>
                <span className="text-gray-900">{document._count.versions}</span>
              </div>
            </div>
          </div>

          {/* People card */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Người liên quan</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Người tạo:</span>{' '}
                <span className="text-gray-900">
                  {document.createdByUser?.fullName ?? document.createdByUser?.email ?? 'N/A'}
                </span>
              </div>
              {document.project && (
                <div>
                  <span className="text-gray-500">Dự án:</span>{' '}
                  <span className="font-medium text-blue-600">{document.project.name}</span>
                  {' '}
                  <span className="text-gray-400 text-xs">({document.project.code})</span>
                </div>
              )}
              {document.handover && (
                <div>
                  <span className="text-gray-500">Bàn giao:</span>{' '}
                  <span className="text-gray-900">{document.handover.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps card */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2 text-sm">
            <h3 className="text-sm font-semibold text-gray-700">Thời gian</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Ngày tạo</span>
              <span className="text-gray-900">{formatDate(document.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Cập nhật lúc</span>
              <span className="text-gray-900">{formatDate(document.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

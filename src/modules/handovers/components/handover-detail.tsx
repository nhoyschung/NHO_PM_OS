'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  CheckSquare,
  FileText,
  ScrollText,
  Calendar,
  Building2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import {
  STATUS_LABELS,
  TYPE_LABELS,
  CHECKLIST_CATEGORY_LABELS,
  CHECKLIST_PRIORITY_LABELS,
  CHECKLIST_PRIORITY_COLORS,
} from '../constants';
import { StatusBadge } from './status-badge';
import { TypeBadge } from './type-badge';
import type {
  HandoverDetail as HandoverDetailType,
  HandoverStatus,
  ChecklistCategory,
  ChecklistPriority,
} from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface HandoverDetailProps {
  handover: HandoverDetailType;
  onSubmitForApproval: (notes?: string) => Promise<{ success: boolean; error?: string }>;
  onApprove: (notes?: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (reason: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onToggleChecklistItem: (itemId: string, isCompleted: boolean) => Promise<{ success: boolean; error?: string }>;
}

// ── Tab definitions ─────────────────────────────────────────────

type TabKey = 'checklist' | 'documents' | 'details';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

// ── Component ───────────────────────────────────────────────────

export function HandoverDetail({
  handover,
  onSubmitForApproval,
  onApprove,
  onReject,
  onToggleChecklistItem,
}: HandoverDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('checklist');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs: TabDef[] = [
    { key: 'checklist', label: 'Kiểm tra', icon: CheckSquare, count: handover._count.checklistItems },
    { key: 'documents', label: 'Tài liệu', icon: FileText, count: handover._count.documents },
    { key: 'details', label: 'Chi tiết', icon: ScrollText },
  ];

  const handleSubmit = async () => {
    setIsProcessing(true);
    setActionError(null);
    const result = await onSubmitForApproval();
    if (!result.success) {
      setActionError(result.error ?? 'Lỗi khi gửi đánh giá.');
    }
    setIsProcessing(false);
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    setActionError(null);
    const result = await onApprove();
    if (!result.success) {
      setActionError(result.error ?? 'Lỗi khi phê duyệt.');
    }
    setIsProcessing(false);
  };

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setActionError('Lý do từ chối là bắt buộc.');
      return;
    }
    setIsProcessing(true);
    setActionError(null);
    const result = await onReject(rejectReason);
    if (!result.success) {
      setActionError(result.error ?? 'Lỗi khi từ chối.');
    } else {
      setShowRejectDialog(false);
      setRejectReason('');
    }
    setIsProcessing(false);
  };

  const status = handover.status as HandoverStatus;

  return (
    <div className="space-y-6">
      {/* Back link + title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/handovers"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Quay lại danh sách"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{handover.title}</h1>
              <StatusBadge status={status} />
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
              <TypeBadge type={handover.type as HandoverDetailType['type']} />
              {handover.project && (
                <Link
                  href={`/dashboard/projects/${handover.project.slug}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {handover.project.code}
                </Link>
              )}
            </div>
          </div>
        </div>

        {status === 'draft' && (
          <Link
            href={`/dashboard/handovers/${handover.id}/edit`}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </Link>
        )}
      </div>

      {/* Action buttons based on status */}
      <div className="flex flex-wrap items-center gap-3">
        {status === 'draft' && (
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Gửi đánh giá
          </button>
        )}
        {status === 'in_review' && (
          <>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Phê duyệt
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Từ chối
            </button>
          </>
        )}
      </div>

      {/* Rejection dialog */}
      {showRejectDialog && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">Từ chối bàn giao</h3>
          <p className="mt-1 text-sm text-red-600">
            Vui lòng nêu lý do từ chối bàn giao này.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Lý do từ chối..."
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Xác nhận từ chối
            </button>
            <button
              onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* Rejection reason display */}
      {handover.rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">Lý do từ chối</h3>
          <p className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{handover.rejectionReason}</p>
        </div>
      )}

      {/* Main content: two columns on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: tabs content (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Tab bar */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-1 overflow-x-auto" aria-label="Tab bàn giao">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                      activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab content */}
          <div className="mt-4">
            {activeTab === 'checklist' && (
              <ChecklistTab
                handover={handover}
                onToggle={onToggleChecklistItem}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab handover={handover} />
            )}
            {activeTab === 'details' && (
              <DetailsTab handover={handover} />
            )}
          </div>
        </div>

        {/* Right column: sidebar info (1/3 width) */}
        <div className="space-y-4">
          <InfoCard handover={handover} />
          <PartiesCard handover={handover} />
        </div>
      </div>
    </div>
  );
}

// ── Checklist Tab ────────────────────────────────────────────────

function ChecklistTab({
  handover,
  onToggle,
}: {
  handover: HandoverDetailType;
  onToggle: (itemId: string, isCompleted: boolean) => Promise<{ success: boolean; error?: string }>;
}) {
  const items = handover.checklistItems ?? [];
  const isEditable = handover.status !== 'completed' && handover.status !== 'cancelled';

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12">
        <CheckSquare className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Chưa có mục kiểm tra nào.</p>
      </div>
    );
  }

  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tiến độ kiểm tra</span>
          <span className="font-medium text-gray-900">
            {completedCount}/{totalCount} ({progressPercent}%)
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200">
          <div
            className="h-2.5 rounded-full bg-blue-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-200">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-4">
            <input
              type="checkbox"
              checked={item.isCompleted}
              disabled={!isEditable}
              onChange={() => onToggle(item.id, !item.isCompleted)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-medium', item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900')}>
                  {item.title}
                </p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    CHECKLIST_PRIORITY_COLORS[item.priority as ChecklistPriority]?.bg,
                    CHECKLIST_PRIORITY_COLORS[item.priority as ChecklistPriority]?.text,
                  )}
                >
                  {CHECKLIST_PRIORITY_LABELS[item.priority as ChecklistPriority]}
                </span>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span>{CHECKLIST_CATEGORY_LABELS[item.category as ChecklistCategory]}</span>
                {item.isCompleted && item.completedByUser && (
                  <span>
                    {item.completedByUser.fullName ?? item.completedByUser.email} -{' '}
                    {item.completedAt ? formatDate(item.completedAt) : ''}
                  </span>
                )}
                {item.requiresEvidence && (
                  <span className="text-amber-600">Yêu cầu bằng chứng</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Documents Tab ───────────────────────────────────────────────

function DocumentsTab({ handover }: { handover: HandoverDetailType }) {
  const docs = handover.documents ?? [];

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12">
        <FileText className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Chưa có tài liệu nào.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-200">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center gap-3 p-4">
          <FileText className="h-5 w-5 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{doc.title}</p>
            <p className="text-xs text-gray-500">
              {doc.type} - {formatDate(doc.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Details Tab ─────────────────────────────────────────────────

function DetailsTab({ handover }: { handover: HandoverDetailType }) {
  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-900">Mô tả</h3>
        <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
          {handover.description || 'Chưa có mô tả.'}
        </p>
      </div>

      {/* Notes */}
      {handover.notes && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-medium text-gray-900">Ghi chú</h3>
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{handover.notes}</p>
        </div>
      )}

      {/* Stage context */}
      {(handover.fromStage || handover.toStage) && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-medium text-gray-900">Ngữ cảnh giai đoạn</h3>
          <div className="mt-2 text-sm text-gray-600">
            {handover.fromStage && <span>Từ: {handover.fromStage}</span>}
            {handover.fromStage && handover.toStage && <span> → </span>}
            {handover.toStage && <span>Đến: {handover.toStage}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Info Card (sidebar) ─────────────────────────────────────────

function InfoCard({ handover }: { handover: HandoverDetailType }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Thông tin bàn giao</h3>
      <dl className="mt-4 space-y-3 text-sm">
        <InfoRow
          label="Trạng thái"
          value={<StatusBadge status={handover.status as HandoverStatus} />}
        />
        <InfoRow
          label="Loại"
          value={TYPE_LABELS[handover.type as HandoverDetailType['type']]}
        />
        {handover.project && (
          <InfoRow
            label="Dự án"
            value={
              <Link
                href={`/dashboard/projects/${handover.project.slug}`}
                className="text-blue-600 hover:text-blue-700"
              >
                {handover.project.name}
              </Link>
            }
          />
        )}
        <InfoRow
          icon={Calendar}
          label="Ngày khởi tạo"
          value={formatDate(handover.initiatedAt)}
        />
        {handover.dueDate && (
          <InfoRow
            icon={Clock}
            label="Hạn chót"
            value={formatDate(handover.dueDate)}
          />
        )}
        {handover.completedAt && (
          <InfoRow
            icon={CheckCircle}
            label="Hoàn thành"
            value={formatDate(handover.completedAt)}
          />
        )}
        <InfoRow
          label="Kiểm tra"
          value={`${handover._count.checklistCompleted}/${handover._count.checklistItems}`}
        />
        <InfoRow
          label="Ngày tạo"
          value={formatDate(handover.createdAt)}
        />
      </dl>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="flex items-center gap-1.5 text-gray-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}

// ── Parties Card (sidebar) ──────────────────────────────────────

function PartiesCard({ handover }: { handover: HandoverDetailType }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Các bên</h3>
      <div className="mt-4 space-y-4">
        {/* From user */}
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">Người giao</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
              {(handover.fromUser?.fullName ?? handover.fromUser?.email ?? '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm text-gray-900">{handover.fromUser?.fullName ?? handover.fromUser?.email ?? '—'}</p>
              {handover.fromDepartment && (
                <p className="text-xs text-gray-500">{handover.fromDepartment.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* To user */}
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">Người nhận</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-700">
              {(handover.toUser?.fullName ?? handover.toUser?.email ?? '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm text-gray-900">{handover.toUser?.fullName ?? handover.toUser?.email ?? '—'}</p>
              {handover.toDepartment && (
                <p className="text-xs text-gray-500">{handover.toDepartment.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Approved by */}
        {handover.approvedByUser && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Người phê duyệt</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                {(handover.approvedByUser.fullName ?? handover.approvedByUser.email).charAt(0).toUpperCase()}
              </span>
              <p className="text-sm text-gray-900">
                {handover.approvedByUser.fullName ?? handover.approvedByUser.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

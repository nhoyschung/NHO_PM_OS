'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Folder,
  Hash,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import {
  FINANCE_TYPE_LABELS,
  FINANCE_CATEGORY_LABELS,
  FINANCE_STATUS_LABELS,
  FINANCE_STATUS_COLORS,
  isIncomeType,
  FINANCE_CLASS_COLORS,
} from '../constants';
import type { FinanceDetail as FinanceDetailType } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface FinanceDetailProps {
  record: FinanceDetailType;
  onApprove: (recordId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (recordId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

// ── Info Row ──────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 flex-1">{children}</span>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const statusKey = status as keyof typeof FINANCE_STATUS_COLORS;
  const colors = FINANCE_STATUS_COLORS[statusKey] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
  const label = FINANCE_STATUS_LABELS[statusKey] ?? status;
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

// ── Component ─────────────────────────────────────────────────────

export function FinanceDetail({ record, onApprove, onReject }: FinanceDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const isIncome = isIncomeType(record.type);
  const classColors = isIncome ? FINANCE_CLASS_COLORS.income : FINANCE_CLASS_COLORS.expense;
  const classLabel = isIncome ? 'Thu' : 'Chi';

  const handleApprove = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await onApprove(record.id, approveNotes || undefined);
      if (!result.success) {
        setActionError(result.error ?? 'Có lỗi xảy ra khi duyệt bản ghi.');
      } else {
        setShowApproveDialog(false);
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setActionError('Vui lòng nhập lý do từ chối.');
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await onReject(record.id, rejectReason);
      if (!result.success) {
        setActionError(result.error ?? 'Có lỗi xảy ra khi từ chối bản ghi.');
      } else {
        setShowRejectDialog(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/finance"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Danh sách tài chính
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-3">
            <DollarSign className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  classColors.bg,
                  classColors.text,
                )}
              >
                {classLabel}
              </span>
              <StatusBadge status={record.status} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{record.description}</h1>
            {record.referenceNumber && (
              <p className="text-sm text-gray-500">#{record.referenceNumber}</p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Số tiền</p>
          <p
            className={cn(
              'text-2xl font-bold tabular-nums',
              isIncome ? 'text-green-700' : 'text-red-700',
            )}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(record.amount)}
          </p>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Chi tiết bản ghi</h2>
          <InfoRow label="Loại giao dịch">
            {FINANCE_TYPE_LABELS[record.type]}
          </InfoRow>
          <InfoRow label="Danh mục">
            {FINANCE_CATEGORY_LABELS[record.category]}
          </InfoRow>
          <InfoRow label="Số tiền">
            <span className={cn('font-medium tabular-nums', isIncome ? 'text-green-700' : 'text-red-700')}>
              {formatCurrency(record.amount)} {record.currency}
            </span>
          </InfoRow>
          <InfoRow label="Ngày giao dịch">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {record.transactionDate}
            </span>
          </InfoRow>
          {record.referenceNumber && (
            <InfoRow label="Mã tham chiếu">
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-gray-400" />
                {record.referenceNumber}
              </span>
            </InfoRow>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Project */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Dự án
            </h3>
            {record.project ? (
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{record.project.name}</p>
                  <p className="text-xs text-gray-500">{record.project.code}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>

          {/* People */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Người liên quan
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Người tạo</p>
                  <p className="text-sm text-gray-900">
                    {record.createdByUser?.fullName ?? record.createdByUser?.email ?? '—'}
                  </p>
                </div>
              </div>
              {record.approvedByUser && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Người duyệt</p>
                    <p className="text-sm text-gray-900">
                      {record.approvedByUser.fullName ?? record.approvedByUser.email}
                    </p>
                    {record.approvedAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(record.approvedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Thời gian
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-500">Tạo lúc:</span>
                <span>{new Date(record.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-500">Cập nhật:</span>
                <span>{new Date(record.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Actions — only for pending records */}
      {record.status === 'pending' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Hành động phê duyệt</h2>
          {actionError && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          {!showApproveDialog && !showRejectDialog && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveDialog(true)}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                disabled={isPending}
              >
                <CheckCircle className="h-4 w-4" />
                Duyệt
              </button>
              <button
                onClick={() => setShowRejectDialog(true)}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isPending}
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </button>
            </div>
          )}

          {showApproveDialog && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Xác nhận duyệt bản ghi &ldquo;{record.description}&rdquo;?
              </p>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Ghi chú (tùy chọn)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isPending ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                </button>
                <button
                  onClick={() => {
                    setShowApproveDialog(false);
                    setActionError(null);
                  }}
                  disabled={isPending}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {showRejectDialog && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Từ chối bản ghi &ldquo;{record.description}&rdquo;?
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Lý do từ chối (bắt buộc)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  {isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectReason('');
                    setActionError(null);
                  }}
                  disabled={isPending}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

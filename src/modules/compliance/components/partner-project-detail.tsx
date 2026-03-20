'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ProjectDetail } from '@/modules/projects/types';
import type { DocumentListItem } from '@/modules/documents/types';
import type { HandoverListItem } from '@/modules/handovers/types';

// ── Tab Definitions (Partner-restricted: overview, documents, handovers) ──

type TabId = 'overview' | 'documents' | 'handovers';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'documents', label: 'Tài liệu' },
  { id: 'handovers', label: 'Bàn giao' },
];

// ── Stage Labels (Vietnamese) ──────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  initiation: 'Khởi tạo',
  planning: 'Lập kế hoạch',
  in_progress: 'Đang thực hiện',
  review: 'Đánh giá',
  testing: 'Kiểm thử',
  staging: 'Tiền triển khai',
  deployment: 'Triển khai',
  monitoring: 'Giám sát',
  handover: 'Bàn giao',
  completed: 'Hoàn thành',
};

const HANDOVER_STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  pending_review: 'Chờ đánh giá',
  in_review: 'Đang đánh giá',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  review: 'Đang đánh giá',
  approved: 'Đã duyệt',
  archived: 'Đã lưu trữ',
  obsolete: 'Lỗi thời',
};

// ── Props ──────────────────────────────────────────────────────────

interface PartnerProjectDetailProps {
  project: ProjectDetail;
  documents: DocumentListItem[];
  handovers: HandoverListItem[];
}

// ── Component ──────────────────────────────────────────────────────

export function PartnerProjectDetail({
  project,
  documents,
  handovers,
}: PartnerProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div>
        <Link
          href="/partner/projects"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Quay lại danh sách
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {project.name}
        </h1>
        <p className="text-sm text-gray-500">
          {project.code} &middot;{' '}
          {STAGE_LABELS[project.stage] ?? project.stage}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab project={project} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab documents={documents} />
      )}
      {activeTab === 'handovers' && (
        <HandoversTab handovers={handovers} />
      )}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────

function OverviewTab({ project }: { project: ProjectDetail }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <InfoCard label="Giai đoạn" value={STAGE_LABELS[project.stage] ?? project.stage} />
      <InfoCard label="Ưu tiên" value={project.priority} />
      <InfoCard label="Tiến độ" value={`${project.progressPercentage ?? 0}%`} />
      <InfoCard label="Tỉnh/TP" value={project.province ?? '—'} />
      <InfoCard label="Ngày bắt đầu" value={project.startDate ?? '—'} />
      <InfoCard label="Ngày kết thúc" value={project.endDate ?? '—'} />
      {project.description && (
        <div className="col-span-full rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Mô tả</p>
          <p className="mt-1 text-sm text-gray-900">{project.description}</p>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

// ── Documents Tab ──────────────────────────────────────────────────

function DocumentsTab({ documents }: { documents: DocumentListItem[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">Chưa có tài liệu nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tiêu đề
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Loại
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Ngày tạo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {doc.title}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {doc.type}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {DOC_STATUS_LABELS[doc.status] ?? doc.status}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {doc.createdAt.toLocaleDateString('vi-VN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Handovers Tab ──────────────────────────────────────────────────

function HandoversTab({ handovers }: { handovers: HandoverListItem[] }) {
  if (handovers.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">Chưa có bàn giao nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tiêu đề
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Người giao
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Người nhận
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Ngày tạo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {handovers.map((handover) => (
            <tr key={handover.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {handover.title}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {HANDOVER_STATUS_LABELS[handover.status] ?? handover.status}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {handover.fromUserName ?? '—'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {handover.toUserName ?? '—'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {handover.createdAt.toLocaleDateString('vi-VN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

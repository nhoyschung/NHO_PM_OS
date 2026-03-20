'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Users,
  FileText,
  CheckSquare,
  DollarSign,
  ScrollText,
  ArrowRightLeft,
  Calendar,
  MapPin,
  Building2,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  STAGE_LABELS,
  PRIORITY_LABELS,
  HEALTH_LABELS,
  HEALTH_COLORS,
} from '../constants';
import { StageBadge } from './stage-badge';
import { PriorityBadge } from './priority-badge';
import { HealthBadge } from './health-badge';
import { StageTransitionBar } from './stage-transition-bar';
import { EntityLink } from '@/components/shared/entity-link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { STATUS_LABELS as HANDOVER_STATUS_LABELS, STATUS_COLORS as HANDOVER_STATUS_COLORS, TYPE_LABELS as HANDOVER_TYPE_LABELS } from '@/modules/handovers/constants';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS } from '@/modules/documents/constants';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/modules/tasks/constants';
import { FINANCE_TYPE_LABELS, FINANCE_TYPE_COLORS, FINANCE_STATUS_LABELS, FINANCE_STATUS_COLORS } from '@/modules/finance/constants';
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS, SEVERITY_LABELS, SEVERITY_COLORS } from '@/modules/audit-logs/constants';
import type { ProjectDetail as ProjectDetailType, ProjectStage } from '../types';
import type { HandoverListItem } from '@/modules/handovers/types';
import type { DocumentListItem } from '@/modules/documents/types';
import type { TaskListItem } from '@/modules/tasks/types';
import type { FinanceListItem, FinanceSummary } from '@/modules/finance/types';
import type { AuditLogListItem } from '@/modules/audit-logs/types';

// ── Types ─────────────────────────────────────────────────────────

interface ProjectDetailProps {
  project: ProjectDetailType;
  onTransition: (targetStage: ProjectStage, notes?: string) => Promise<{ success: boolean; error?: string }>;
  handovers: HandoverListItem[];
  documents: DocumentListItem[];
  tasks: TaskListItem[];
  financeRecords: FinanceListItem[];
  financeSummary: FinanceSummary;
  auditLogs: AuditLogListItem[];
}

// ── Tab definitions ───────────────────────────────────────────────

type TabKey = 'overview' | 'handovers' | 'documents' | 'tasks' | 'finance' | 'audit';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

// ── Component ─────────────────────────────────────────────────────

export function ProjectDetail({
  project,
  onTransition,
  handovers,
  documents,
  tasks,
  financeRecords,
  financeSummary,
  auditLogs,
}: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const tabs: TabDef[] = [
    { key: 'overview', label: 'Tổng quan', icon: FileText },
    { key: 'handovers', label: 'Bàn giao', icon: ArrowRightLeft, count: handovers.length },
    { key: 'documents', label: 'Tài liệu', icon: FileText, count: documents.length },
    { key: 'tasks', label: 'Công việc', icon: CheckSquare, count: tasks.length },
    { key: 'finance', label: 'Tài chính', icon: DollarSign, count: financeRecords.length },
    { key: 'audit', label: 'Nhật ký', icon: ScrollText, count: auditLogs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dự án', href: '/dashboard/projects' },
          { label: project.name },
        ]}
      />

      {/* Back link + title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/projects"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Quay lại danh sách"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <StageBadge stage={project.stage as ProjectStage} />
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{project.code}</p>
          </div>
        </div>

        <Link
          href={`/dashboard/projects/${project.slug}/edit`}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
          Chỉnh sửa
        </Link>
      </div>

      {/* Stage transition bar */}
      <StageTransitionBar
        projectId={project.id}
        currentStage={project.stage as ProjectStage}
        onTransition={onTransition}
      />

      {/* Main content: two columns on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: tabs content (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Tab bar */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-1 overflow-x-auto" aria-label="Tab dự án">
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
            {activeTab === 'overview' && <OverviewTab project={project} />}
            {activeTab === 'handovers' && <HandoversTab handovers={handovers} projectSlug={project.slug} />}
            {activeTab === 'documents' && <DocumentsTab documents={documents} />}
            {activeTab === 'tasks' && <TasksTab tasks={tasks} />}
            {activeTab === 'finance' && <FinanceTab project={project} financeRecords={financeRecords} financeSummary={financeSummary} />}
            {activeTab === 'audit' && <AuditTab auditLogs={auditLogs} />}
          </div>
        </div>

        {/* Right column: sidebar info (1/3 width) */}
        <div className="space-y-4">
          <InfoCard project={project} />
          <MembersCard project={project} />
        </div>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────

function OverviewTab({ project }: { project: ProjectDetailType }) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-900">Mô tả</h3>
        <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
          {project.description || 'Chưa có mô tả.'}
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-900">Tiến độ</h3>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Hoàn thành</span>
            <span className="font-medium text-gray-900">
              {project.progressPercentage ?? 0}%
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${project.progressPercentage ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage History */}
      {project.stageHistory && project.stageHistory.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-medium text-gray-900">Lịch sử giai đoạn</h3>
          <div className="mt-3 space-y-3">
            {project.stageHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-gray-700">
                    {STAGE_LABELS[entry.fromStage as ProjectStage] ?? entry.fromStage}
                    {' → '}
                    {STAGE_LABELS[entry.toStage as ProjectStage] ?? entry.toStage}
                  </p>
                  {entry.notes && (
                    <p className="mt-0.5 text-gray-500">{entry.notes}</p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Handovers Tab ─────────────────────────────────────────────────

function HandoversTab({ handovers, projectSlug }: { handovers: HandoverListItem[]; projectSlug: string }) {
  if (handovers.length === 0) {
    return (
      <EmptyTabState icon={ArrowRightLeft} message="Chưa có bàn giao nào." />
    );
  }

  return (
    <div className="space-y-3">
      {handovers.map((h) => {
        const statusColor = HANDOVER_STATUS_COLORS[h.status] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
          <div key={h.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <EntityLink type="handover" id={h.id} name={h.title} />
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className={cn('rounded-full px-2 py-0.5 font-medium', statusColor.bg, statusColor.text)}>
                    {HANDOVER_STATUS_LABELS[h.status]}
                  </span>
                  <span>{HANDOVER_TYPE_LABELS[h.type]}</span>
                  {h.fromUserName && h.toUserName && (
                    <span>{h.fromUserName} → {h.toUserName}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right text-xs text-gray-400">
                {h.dueDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(h.dueDate)}
                  </div>
                )}
                <div className="mt-0.5">
                  {h.checklistCompletedCount}/{h.checklistItemCount} mục
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────

function DocumentsTab({ documents }: { documents: DocumentListItem[] }) {
  if (documents.length === 0) {
    return (
      <EmptyTabState icon={FileText} message="Chưa có tài liệu nào." />
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const statusColor = DOCUMENT_STATUS_COLORS[doc.status] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
          <div key={doc.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <EntityLink type="document" id={doc.id} name={doc.title} />
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className={cn('rounded-full px-2 py-0.5 font-medium', statusColor.bg, statusColor.text)}>
                    {DOCUMENT_STATUS_LABELS[doc.status]}
                  </span>
                  <span>{DOCUMENT_TYPE_LABELS[doc.type]}</span>
                  {doc.createdByName && <span>bởi {doc.createdByName}</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-right text-xs text-gray-400">
                <div>v{doc.currentVersion}</div>
                <div className="mt-0.5">{formatDate(doc.updatedAt)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────

function TasksTab({ tasks }: { tasks: TaskListItem[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyTabState icon={CheckSquare} message="Chưa có công việc nào." />
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const statusColor = TASK_STATUS_COLORS[task.status] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
        const priorityColor = TASK_PRIORITY_COLORS[task.priority] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
          <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">{task.code}</span>
                  <EntityLink type="task" id={task.id} name={task.title} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className={cn('rounded-full px-2 py-0.5 font-medium', statusColor.bg, statusColor.text)}>
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  <span className={cn('rounded-full px-2 py-0.5 font-medium', priorityColor.bg, priorityColor.text)}>
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </span>
                  {task.assigneeName && <span>{task.assigneeName}</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-right text-xs text-gray-400">
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.dueDate}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Finance Tab ──────────────────────────────────────────────────

function FinanceTab({
  project,
  financeRecords,
  financeSummary,
}: {
  project: ProjectDetailType;
  financeRecords: FinanceListItem[];
  financeSummary: FinanceSummary;
}) {
  const budget = project.budget ?? 0;
  const spent = project.budgetSpent ?? 0;
  const remaining = budget - spent;
  const spentPercent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  return (
    <div className="space-y-4">
      {/* Budget summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Ngân sách phân bổ</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {budget > 0 ? formatCurrency(budget) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Đã chi</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatCurrency(spent)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Còn lại</p>
          <p
            className={cn(
              'mt-1 text-xl font-bold',
              remaining >= 0 ? 'text-green-700' : 'text-red-700',
            )}
          >
            {budget > 0 ? formatCurrency(remaining) : '—'}
          </p>
        </div>
      </div>

      {budget > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sử dụng ngân sách</span>
            <span className="font-medium text-gray-900">{spentPercent.toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200">
            <div
              className={cn(
                'h-2.5 rounded-full transition-all',
                spentPercent > 90 ? 'bg-red-500' : spentPercent > 70 ? 'bg-yellow-500' : 'bg-green-500',
              )}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Finance summary from module */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Tổng thu</p>
          <p className="mt-1 text-lg font-bold text-green-700">
            {formatCurrency(financeSummary.totalIncome)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Tổng chi</p>
          <p className="mt-1 text-lg font-bold text-red-700">
            {formatCurrency(financeSummary.totalExpense)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Số dư</p>
          <p className={cn('mt-1 text-lg font-bold', financeSummary.balance >= 0 ? 'text-green-700' : 'text-red-700')}>
            {formatCurrency(financeSummary.balance)}
          </p>
        </div>
      </div>

      {/* Finance records list */}
      {financeRecords.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Giao dịch gần đây</h4>
          {financeRecords.map((record) => {
            const typeColor = FINANCE_TYPE_COLORS[record.type] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
            const statusColor = FINANCE_STATUS_COLORS[record.status] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
            return (
              <div key={record.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <EntityLink type="finance" id={record.id} name={record.description} />
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className={cn('rounded-full px-2 py-0.5 font-medium', typeColor.bg, typeColor.text)}>
                        {FINANCE_TYPE_LABELS[record.type]}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 font-medium', statusColor.bg, statusColor.text)}>
                        {FINANCE_STATUS_LABELS[record.status]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(record.amount)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{record.transactionDate}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyTabState icon={DollarSign} message="Chưa có giao dịch nào." />
      )}
    </div>
  );
}

// ── Audit Tab ─────────────────────────────────────────────────────

function AuditTab({ auditLogs }: { auditLogs: AuditLogListItem[] }) {
  if (auditLogs.length === 0) {
    return (
      <EmptyTabState icon={ScrollText} message="Chưa có nhật ký nào." />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="divide-y divide-gray-200">
        {auditLogs.map((log) => {
          const actionColor = AUDIT_ACTION_COLORS[log.action] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
          const severityColor = SEVERITY_COLORS[log.severity] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
          return (
            <div key={log.id} className="flex items-start gap-4 p-4">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', actionColor.bg, actionColor.text)}>
                    {AUDIT_ACTION_LABELS[log.action]}
                  </span>
                  {log.severity !== 'info' && (
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', severityColor.bg, severityColor.text)}>
                      {SEVERITY_LABELS[log.severity]}
                    </span>
                  )}
                  {log.entityName && (
                    <span className="text-sm text-gray-700">{log.entityName}</span>
                  )}
                </div>
                {log.description && (
                  <p className="mt-1 text-sm text-gray-600">{log.description}</p>
                )}
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  {log.userEmail && <span>{log.userEmail}</span>}
                  <span>{formatDate(log.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Info Card (sidebar) ──────────────────────────────────────────

function InfoCard({ project }: { project: ProjectDetailType }) {
  const healthStatus = project.healthStatus as ProjectDetailType['healthStatus'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Thông tin dự án</h3>
      <dl className="mt-4 space-y-3 text-sm">
        <InfoRow
          label="Trạng thái"
          value={
            healthStatus ? (
              <HealthBadge status={healthStatus as Parameters<typeof HealthBadge>[0]['status']} />
            ) : (
              '—'
            )
          }
        />
        <InfoRow
          label="Ưu tiên"
          value={<PriorityBadge priority={project.priority as Parameters<typeof PriorityBadge>[0]['priority']} />}
        />
        <InfoRow
          label="Người phụ trách"
          value={project.manager?.fullName ?? '—'}
        />
        <InfoRow
          label="Trưởng nhóm"
          value={project.teamLead?.fullName ?? '—'}
        />
        {project.department && (
          <InfoRow
            icon={Building2}
            label="Phòng ban"
            value={project.department.name}
          />
        )}
        {project.province && (
          <InfoRow
            icon={MapPin}
            label="Tỉnh/Thành phố"
            value={project.province}
          />
        )}
        <InfoRow
          icon={Calendar}
          label="Ngày bắt đầu"
          value={project.startDate ? formatDate(new Date(project.startDate)) : '—'}
        />
        <InfoRow
          icon={Calendar}
          label="Ngày kết thúc dự kiến"
          value={project.endDate ? formatDate(new Date(project.endDate)) : '—'}
        />
        {project.budget != null && project.budget > 0 && (
          <InfoRow
            icon={DollarSign}
            label="Ngân sách"
            value={formatCurrency(project.budget)}
          />
        )}
        <InfoRow
          label="Ngày tạo"
          value={formatDate(project.createdAt)}
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

// ── Members Card (sidebar) ───────────────────────────────────────

function MembersCard({ project }: { project: ProjectDetailType }) {
  const activeMembers = project.members?.filter((m) => m.isActive) ?? [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Thành viên</h3>
        <span className="text-xs text-gray-500">{activeMembers.length} thành viên</span>
      </div>

      {activeMembers.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {activeMembers.slice(0, 8).map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                {(member.user.fullName ?? member.user.email).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900">
                  {member.user.fullName ?? member.user.email}
                </p>
                <p className="text-xs capitalize text-gray-500">{member.role}</p>
              </div>
            </li>
          ))}
          {activeMembers.length > 8 && (
            <li className="text-xs text-gray-500">
              +{activeMembers.length - 8} thành viên khác
            </li>
          )}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-500">Chưa có thành viên nào.</p>
      )}

      <Link
        href={`/dashboard/projects/${project.slug}/members`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <Users className="h-3.5 w-3.5" />
        Quản lý thành viên
      </Link>
    </div>
  );
}

// ── Empty Tab State ──────────────────────────────────────────────

function EmptyTabState({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12">
      <Icon className="h-10 w-10 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  );
}

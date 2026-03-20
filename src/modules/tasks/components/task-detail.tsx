'use client';

import { useState, useTransition } from 'react';
import {
  Calendar,
  Clock,
  User,
  FolderKanban,
  Tag,
  AlertTriangle,
  CheckSquare,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  ALLOWED_TASK_TRANSITIONS,
} from '../constants';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import type { TaskDetail as TaskDetailType, TaskStatus } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface TaskDetailProps {
  task: TaskDetailType;
  onTransition: (fromStatus: TaskStatus, toStatus: TaskStatus, notes?: string) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────

export function TaskDetail({ task, onTransition }: TaskDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<TaskStatus | null>(null);
  const [transitionNotes, setTransitionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentStatus = task.status as TaskStatus;
  const allowedTransitions = ALLOWED_TASK_TRANSITIONS[currentStatus] ?? [];

  const isOverdue =
    task.dueDate &&
    currentStatus !== 'done' &&
    currentStatus !== 'cancelled' &&
    task.dueDate < new Date().toISOString().split('T')[0];

  const handleConfirmTransition = () => {
    if (!confirmTarget) return;
    setError(null);
    startTransition(async () => {
      try {
        await onTransition(currentStatus, confirmTarget, transitionNotes || undefined);
        setConfirmTarget(null);
        setTransitionNotes('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi.');
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FolderKanban className="h-4 w-4" />
            <span>{task.project?.name ?? '—'}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-mono">{task.code}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={currentStatus} />
            <TaskPriorityBadge priority={task.priority as 'critical' | 'high' | 'medium' | 'low'} />
            <span className="text-xs text-gray-500">{TASK_TYPE_LABELS[task.type as keyof typeof TASK_TYPE_LABELS]}</span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Quá hạn
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Transition Bar */}
      {allowedTransitions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">Chuyển trạng thái:</p>
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.map((target) => (
              <button
                key={target}
                onClick={() => setConfirmTarget(target)}
                disabled={isPending}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {TASK_STATUS_LABELS[target]}
              </button>
            ))}
          </div>

          {/* Confirmation dialog */}
          {confirmTarget && (
            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-800">
                Chuyển sang &ldquo;{TASK_STATUS_LABELS[confirmTarget]}&rdquo;?
              </p>
              <textarea
                placeholder="Ghi chú (tùy chọn)..."
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                rows={2}
                className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleConfirmTransition}
                  disabled={isPending}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
                <button
                  onClick={() => { setConfirmTarget(null); setTransitionNotes(''); }}
                  disabled={isPending}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Mô tả</h2>
            {task.description ? (
              <p className="whitespace-pre-wrap text-sm text-gray-600">{task.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Chưa có mô tả.</p>
            )}
          </div>

          {/* Subtasks */}
          {(task.subtasks?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">
                Công việc con ({task._count.subtasks})
              </h2>
              <ul className="space-y-2">
                {task.subtasks?.map((sub) => (
                  <li key={sub.id} className="flex items-center gap-3 text-sm">
                    <CheckSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-mono text-xs text-gray-500">{sub.code}</span>
                    <span className="text-gray-700">{sub.title}</span>
                    <TaskStatusBadge status={sub.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {(task.tags as string[])?.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold text-gray-700">
                <Tag className="h-3.5 w-3.5" />
                Nhãn
              </h2>
              <div className="flex flex-wrap gap-2">
                {(task.tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info cards */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Thông tin</h2>
            <dl className="space-y-3">
              {/* Assignee */}
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Người được giao</dt>
                  <dd className="text-sm text-gray-900">
                    {task.assignee ? (task.assignee.fullName ?? task.assignee.email) : '—'}
                  </dd>
                </div>
              </div>

              {/* Reporter */}
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Người báo cáo</dt>
                  <dd className="text-sm text-gray-900">
                    {task.reporter ? (task.reporter.fullName ?? task.reporter.email) : '—'}
                  </dd>
                </div>
              </div>

              {/* Project */}
              <div className="flex items-start gap-2">
                <FolderKanban className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Dự án</dt>
                  <dd className="text-sm text-gray-900">{task.project?.name ?? '—'}</dd>
                </div>
              </div>

              {/* Start date */}
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Ngày bắt đầu</dt>
                  <dd className="text-sm text-gray-900">{task.startDate ?? '—'}</dd>
                </div>
              </div>

              {/* Due date */}
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Hạn chót</dt>
                  <dd
                    className={cn(
                      'text-sm',
                      isOverdue ? 'font-medium text-red-600' : 'text-gray-900',
                    )}
                  >
                    {task.dueDate ?? '—'}
                  </dd>
                </div>
              </div>

              {/* Estimated hours */}
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Giờ ước tính</dt>
                  <dd className="text-sm text-gray-900">
                    {task.estimatedHours != null ? `${task.estimatedHours}h` : '—'}
                  </dd>
                </div>
              </div>

              {/* Actual hours */}
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Giờ thực tế</dt>
                  <dd className="text-sm text-gray-900">
                    {task.actualHours != null ? `${task.actualHours}h` : '—'}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Parent task */}
          {task.parentTask && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Công việc cha</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-gray-500">{task.parentTask.code}</span>
                <span className="text-gray-700">{task.parentTask.title}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

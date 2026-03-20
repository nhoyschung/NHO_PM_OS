'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '../constants';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import type { KanbanColumn, TaskListItem } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface TaskKanbanProps {
  columns: KanbanColumn[];
}

// ── Component ─────────────────────────────────────────────────────

export function TaskKanban({ columns }: TaskKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <KanbanColumnView key={column.status} column={column} />
      ))}
    </div>
  );
}

// ── KanbanColumnView ──────────────────────────────────────────────

function KanbanColumnView({ column }: { column: KanbanColumn }) {
  const statusColors = TASK_STATUS_COLORS[column.status];

  return (
    <div className="flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-lg border border-gray-200 bg-gray-50">
      {/* Column header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-block h-2.5 w-2.5 rounded-full',
              statusColors.bg.replace('bg-', 'bg-').replace('-100', '-500'),
            )}
          />
          <h3 className="text-sm font-semibold text-gray-800">{column.label}</h3>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {column.count}
        </span>
      </div>

      {/* Task cards */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {column.tasks.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">Chưa có công việc</p>
        ) : (
          column.tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────

function TaskCard({ task }: { task: TaskListItem }) {
  const router = useRouter();

  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    task.status !== 'cancelled' &&
    task.dueDate < new Date().toISOString().split('T')[0];

  const priorityColors = TASK_PRIORITY_COLORS[task.priority];

  return (
    <div
      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
      className={cn(
        'cursor-pointer rounded-md border bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
        isOverdue ? 'border-red-200' : 'border-gray-200',
      )}
    >
      {/* Priority indicator bar */}
      <div
        className={cn('mb-2 h-1 w-full rounded-full', priorityColors.bg)}
      />

      {/* Task code + title */}
      <div className="mb-2">
        <span className="font-mono text-xs text-gray-400">{task.code}</span>
        <p className="mt-0.5 text-sm font-medium text-gray-900 line-clamp-2">{task.title}</p>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority} />
        {task.projectCode && (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs text-gray-500 bg-gray-100">
            {task.projectCode}
          </span>
        )}
      </div>

      {/* Footer: assignee + due date */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{task.assigneeName ?? 'Chưa giao'}</span>
        {task.dueDate && (
          <span
            className={cn(
              'flex items-center gap-1',
              isOverdue && 'font-medium text-red-600',
            )}
          >
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
            {task.dueDate}
          </span>
        )}
      </div>
    </div>
  );
}

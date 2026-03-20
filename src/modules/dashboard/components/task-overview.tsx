'use client';

import { cn } from '@/lib/utils';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/modules/tasks/constants';
import type { TaskStatus } from '@/modules/tasks/types';
import type { TaskStats } from '@/modules/tasks/queries';

// ── Status display order ────────────────────────────────────────

const STATUS_ORDER: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'testing',
  'done',
  'cancelled',
];

// ── Task Overview Component ─────────────────────────────────────

interface TaskOverviewProps {
  taskStats: TaskStats;
}

export function TaskOverview({ taskStats }: TaskOverviewProps) {
  const total = taskStats.totalTasks;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Tổng quan công việc
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({total} tổng)
          </span>
        </h3>
        {taskStats.overdueCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            {taskStats.overdueCount} quá hạn
          </span>
        )}
      </div>
      <div className="space-y-3">
        {STATUS_ORDER.map((status) => {
          const statusCount = taskStats.countByStatus[status] ?? 0;
          const percentage = total > 0 ? (statusCount / total) * 100 : 0;
          const colors = TASK_STATUS_COLORS[status];

          return (
            <div key={status} className="flex items-center gap-3">
              <div className="w-28 text-xs text-gray-500 truncate flex-shrink-0">
                {TASK_STATUS_LABELS[status]}
              </div>
              <div className="flex-1 h-5 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className={`h-full ${colors.bg} rounded-sm transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-xs text-right flex-shrink-0">
                <span className="font-medium text-gray-900">{statusCount}</span>
                <span className="text-gray-500 ml-1">
                  ({percentage > 0 ? percentage.toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overdue highlight */}
      {taskStats.overdueCount > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">
            {taskStats.overdueCount} công việc quá hạn cần xử lý
          </p>
        </div>
      )}
    </div>
  );
}

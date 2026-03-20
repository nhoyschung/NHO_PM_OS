'use client';

import { cn } from '@/lib/utils';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../constants';
import type { TaskStatus } from '../types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const colors = TASK_STATUS_COLORS[status];
  const label = TASK_STATUS_LABELS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
        className,
      )}
    >
      {label}
    </span>
  );
}

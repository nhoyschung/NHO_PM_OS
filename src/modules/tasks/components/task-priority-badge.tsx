'use client';

import { cn } from '@/lib/utils';
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '../constants';
import type { TaskPriority } from '../types';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const colors = TASK_PRIORITY_COLORS[priority];
  const label = TASK_PRIORITY_LABELS[priority];
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

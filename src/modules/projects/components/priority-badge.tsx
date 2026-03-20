'use client';

import { cn } from '@/lib/utils';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../constants';
import type { ProjectPriority } from '../types';

interface PriorityBadgeProps {
  priority: ProjectPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colors = PRIORITY_COLORS[priority];
  const label = PRIORITY_LABELS[priority];

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

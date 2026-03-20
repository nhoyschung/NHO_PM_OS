'use client';

import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import type { HandoverStatus } from '../types';

interface StatusBadgeProps {
  status: HandoverStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

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

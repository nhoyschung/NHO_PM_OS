'use client';

import { cn } from '@/lib/utils';
import { HEALTH_LABELS, HEALTH_COLORS } from '../constants';
import type { HealthStatus } from '../types';

interface HealthBadgeProps {
  status: HealthStatus;
  className?: string;
}

export function HealthBadge({ status, className }: HealthBadgeProps) {
  const colors = HEALTH_COLORS[status];
  const label = HEALTH_LABELS[status];

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

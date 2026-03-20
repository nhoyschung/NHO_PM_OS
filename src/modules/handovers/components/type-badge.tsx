'use client';

import { cn } from '@/lib/utils';
import { TYPE_LABELS, TYPE_COLORS } from '../constants';
import type { HandoverType } from '../types';

interface TypeBadgeProps {
  type: HandoverType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const colors = TYPE_COLORS[type];
  const label = TYPE_LABELS[type];

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

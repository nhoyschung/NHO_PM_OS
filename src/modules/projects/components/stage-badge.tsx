'use client';

import { cn } from '@/lib/utils';
import { STAGE_LABELS, STAGE_COLORS } from '../constants';
import type { ProjectStage } from '../types';

interface StageBadgeProps {
  stage: ProjectStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const colors = STAGE_COLORS[stage];
  const label = STAGE_LABELS[stage];

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

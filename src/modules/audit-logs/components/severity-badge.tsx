'use client';

import { cn } from '@/lib/utils';
import { SEVERITY_LABELS, SEVERITY_COLORS } from '../constants';
import type { AuditSeverity } from '../types';

interface SeverityBadgeProps {
  severity: AuditSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const colors = SEVERITY_COLORS[severity];
  const label = SEVERITY_LABELS[severity];
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

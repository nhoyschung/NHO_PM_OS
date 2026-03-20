'use client';

import { cn } from '@/lib/utils';
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS } from '../constants';
import type { AuditAction } from '../types';

interface ActionBadgeProps {
  action: AuditAction;
  className?: string;
}

export function ActionBadge({ action, className }: ActionBadgeProps) {
  const colors = AUDIT_ACTION_COLORS[action];
  const label = AUDIT_ACTION_LABELS[action];
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

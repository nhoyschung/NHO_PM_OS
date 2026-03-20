'use client';

import { cn } from '@/lib/utils';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS } from '../constants';
import type { DocumentStatus } from '../types';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const colors = DOCUMENT_STATUS_COLORS[status];
  const label = DOCUMENT_STATUS_LABELS[status];
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

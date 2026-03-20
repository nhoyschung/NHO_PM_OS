'use client';

import { cn } from '@/lib/utils';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS } from '../constants';
import type { DocumentType } from '../types';

interface DocumentTypeBadgeProps {
  type: DocumentType;
  className?: string;
}

export function DocumentTypeBadge({ type, className }: DocumentTypeBadgeProps) {
  const colors = DOCUMENT_TYPE_COLORS[type];
  const label = DOCUMENT_TYPE_LABELS[type];
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

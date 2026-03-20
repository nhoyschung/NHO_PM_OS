import Link from 'next/link';
import { cn } from '@/lib/utils';

// ── Entity type to route mapping ─────────────────────────────────

const ENTITY_ROUTES: Record<EntityType, string> = {
  project: '/dashboard/projects',
  handover: '/dashboard/handovers',
  document: '/dashboard/documents',
  task: '/dashboard/tasks',
  finance: '/dashboard/finance',
};

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  project: 'Dự án',
  handover: 'Bàn giao',
  document: 'Tài liệu',
  task: 'Công việc',
  finance: 'Tài chính',
};

// ── Types ────────────────────────────────────────────────────────

type EntityType = 'project' | 'handover' | 'document' | 'task' | 'finance';

interface EntityLinkProps {
  type: EntityType;
  id: string;
  name: string;
  /** Use slug instead of id for the URL (e.g., projects). */
  slug?: string;
  /** Show entity type label before the name. */
  showTypeLabel?: boolean;
  className?: string;
}

// ── Component ────────────────────────────────────────────────────

export function EntityLink({
  type,
  id,
  name,
  slug,
  showTypeLabel = false,
  className,
}: EntityLinkProps) {
  const basePath = ENTITY_ROUTES[type];
  const href = `${basePath}/${slug ?? id}`;

  return (
    <Link
      href={href}
      className={cn(
        'text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline',
        className,
      )}
    >
      {showTypeLabel && (
        <span className="mr-1 text-gray-500">{ENTITY_TYPE_LABELS[type]}:</span>
      )}
      {name}
    </Link>
  );
}

export { ENTITY_ROUTES, ENTITY_TYPE_LABELS };
export type { EntityType, EntityLinkProps };

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

// ── Component ────────────────────────────────────────────────────

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && <ChevronRight className="mx-1.5 h-3.5 w-3.5 flex-shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? 'font-medium text-gray-900' : ''}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-gray-700 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export type { BreadcrumbItem, BreadcrumbsProps };

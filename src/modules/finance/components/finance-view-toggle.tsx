'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────

export type FinanceView = 'list' | 'overview';

interface FinanceViewToggleProps {
  activeView: FinanceView;
}

// ── Component ─────────────────────────────────────────────────────

export function FinanceViewToggle({ activeView }: FinanceViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleViewChange = useCallback(
    (view: FinanceView) => {
      if (view === activeView) return;
      const params = new URLSearchParams(searchParams.toString());
      if (view === 'overview') {
        params.set('view', 'overview');
      } else {
        params.delete('view');
      }
      // Reset page when switching views
      params.delete('page');
      startTransition(() => {
        router.push(`/finance?${params.toString()}`);
      });
    },
    [activeView, router, searchParams],
  );

  const tabs: Array<{ value: FinanceView; label: string }> = [
    { value: 'list', label: 'Danh sách' },
    { value: 'overview', label: 'Tổng quan' },
  ];

  return (
    <div className={cn('flex gap-1 rounded-lg bg-gray-100 p-1', isPending && 'opacity-60')}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleViewChange(tab.value)}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            activeView === tab.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FinanceDetail } from '@/modules/finance/components/finance-detail';
import { approveFinanceRecord, rejectFinanceRecord } from '@/modules/finance/actions';
import type { FinanceDetail as FinanceDetailType } from '@/modules/finance/types';

interface FinanceDetailClientProps {
  record: FinanceDetailType;
}

export function FinanceDetailClient({ record }: FinanceDetailClientProps) {
  const router = useRouter();

  const handleApprove = useCallback(
    async (recordId: string, notes?: string) => {
      const result = await approveFinanceRecord({ recordId, notes });
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    [router],
  );

  const handleReject = useCallback(
    async (recordId: string, reason: string) => {
      const result = await rejectFinanceRecord({ recordId, reason });
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    [router],
  );

  return (
    <FinanceDetail record={record} onApprove={handleApprove} onReject={handleReject} />
  );
}

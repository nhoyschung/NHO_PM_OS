'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HandoverDetail } from '@/modules/handovers/components/handover-detail';
import {
  submitForApprovalAction,
  approveHandoverAction,
  rejectHandoverAction,
  toggleChecklistItemAction,
} from '@/modules/handovers/actions';
import type { HandoverDetail as HandoverDetailType } from '@/modules/handovers/types';

interface HandoverDetailClientProps {
  handover: HandoverDetailType;
}

export function HandoverDetailClient({ handover }: HandoverDetailClientProps) {
  const router = useRouter();

  const handleSubmitForApproval = useCallback(
    async (notes?: string) => {
      const result = await submitForApprovalAction({ handoverId: handover.id, notes });
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    [handover.id, router],
  );

  const handleApprove = useCallback(
    async (notes?: string) => {
      const result = await approveHandoverAction({ handoverId: handover.id, notes });
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    [handover.id, router],
  );

  const handleReject = useCallback(
    async (reason: string, notes?: string) => {
      const result = await rejectHandoverAction({
        handoverId: handover.id,
        rejectionReason: reason,
        notes,
      });
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    [handover.id, router],
  );

  const handleToggleChecklistItem = useCallback(
    async (itemId: string, isCompleted: boolean) => {
      const result = await toggleChecklistItemAction({ itemId, isCompleted });
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    [router],
  );

  return (
    <HandoverDetail
      handover={handover}
      onSubmitForApproval={handleSubmitForApproval}
      onApprove={handleApprove}
      onReject={handleReject}
      onToggleChecklistItem={handleToggleChecklistItem}
    />
  );
}

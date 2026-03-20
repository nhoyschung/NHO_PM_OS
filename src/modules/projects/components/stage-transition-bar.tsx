'use client';

import { useState, useTransition } from 'react';
import { ArrowRight, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALLOWED_TRANSITIONS, STAGE_LABELS, STAGE_COLORS } from '../constants';
import type { ProjectStage } from '../types';

interface StageTransitionBarProps {
  projectId: string;
  currentStage: ProjectStage;
  onTransition: (targetStage: ProjectStage, notes?: string) => Promise<{ success: boolean; error?: string }>;
}

export function StageTransitionBar({
  projectId,
  currentStage,
  onTransition,
}: StageTransitionBarProps) {
  const allowedTargets = ALLOWED_TRANSITIONS[currentStage];
  const [confirmTarget, setConfirmTarget] = useState<ProjectStage | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (allowedTargets.length === 0) {
    return null;
  }

  const handleConfirm = () => {
    if (!confirmTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await onTransition(confirmTarget, notes || undefined);
      if (!result.success) {
        setError(result.error ?? 'Đã xảy ra lỗi khi chuyển giai đoạn');
      } else {
        setConfirmTarget(null);
        setNotes('');
      }
    });
  };

  const handleCancel = () => {
    setConfirmTarget(null);
    setNotes('');
    setError(null);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        {/* Current stage */}
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
            STAGE_COLORS[currentStage].bg,
            STAGE_COLORS[currentStage].text,
          )}
        >
          {STAGE_LABELS[currentStage]}
        </span>

        <ArrowRight className="h-4 w-4 text-gray-400" />

        {/* Target buttons */}
        <div className="flex flex-wrap gap-2">
          {allowedTargets.map((target) => (
            <button
              key={target}
              onClick={() => setConfirmTarget(target)}
              className={cn(
                'inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                confirmTarget === target
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700',
              )}
            >
              {STAGE_LABELS[target]}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirmTarget && (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Bạn có chắc chắn muốn chuyển sang giai đoạn{' '}
                <strong>{STAGE_LABELS[confirmTarget]}</strong>?
              </p>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú (tùy chọn)..."
                rows={2}
                className="mt-3 w-full rounded-md border border-yellow-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

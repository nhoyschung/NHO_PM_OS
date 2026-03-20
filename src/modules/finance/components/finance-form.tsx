'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FINANCE_TYPE_LABELS, FINANCE_CATEGORY_LABELS } from '../constants';
import { createFinanceRecordSchema } from '../validation';
import type { FinanceFormData, FinancialType, FinancialCategory } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface FinanceFormProps {
  defaultValues?: Partial<FinanceFormData>;
  onSubmit: (data: FinanceFormData) => Promise<{ success: boolean; error?: string }>;
  title: string;
  /** List of projects for the project selector */
  projects?: Array<{ id: string; name: string; code: string }>;
}

// ── Field Group ───────────────────────────────────────────────────

function FieldGroup({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── VND Amount Input ──────────────────────────────────────────────

function VndAmountInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-numeric chars
    const raw = e.target.value.replace(/[^\d]/g, '');
    onChange(raw);
  };

  const display = value
    ? new Intl.NumberFormat('vi-VN').format(parseInt(value, 10))
    : '';

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="text"
          value={display}
          onChange={handleChange}
          placeholder="0"
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-14',
            error ? 'border-red-300' : 'border-gray-300',
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          VND
        </span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export function FinanceForm({ defaultValues, onSubmit, title, projects = [] }: FinanceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [amountRaw, setAmountRaw] = useState(
    defaultValues?.amount ? String(defaultValues.amount) : '',
  );

  const TYPE_OPTIONS: Array<{ value: FinancialType; label: string }> = (
    Object.entries(FINANCE_TYPE_LABELS) as Array<[FinancialType, string]>
  ).map(([value, label]) => ({ value, label }));

  const CATEGORY_OPTIONS: Array<{ value: FinancialCategory; label: string }> = (
    Object.entries(FINANCE_CATEGORY_LABELS) as Array<[FinancialCategory, string]>
  ).map(([value, label]) => ({ value, label }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);

    const raw = {
      projectId: fd.get('projectId') as string,
      type: fd.get('type') as string,
      category: (fd.get('category') as string) || 'other',
      amount: parseInt(amountRaw, 10) || 0,
      currency: 'VND',
      description: fd.get('description') as string,
      referenceNumber: (fd.get('referenceNumber') as string) || undefined,
      transactionDate: fd.get('transactionDate') as string,
    };

    // Client-side validation
    const parsed = createFinanceRecordSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (key) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const result = await onSubmit(parsed.data as FinanceFormData);
      if (!result.success) {
        setServerError(result.error ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
      } else {
        router.push('/finance');
      }
    });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>

      {serverError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        {/* Project */}
        <FieldGroup label="Dự án" error={fieldErrors.projectId} required>
          <select
            name="projectId"
            defaultValue={defaultValues?.projectId ?? ''}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.projectId ? 'border-red-300' : 'border-gray-300',
            )}
          >
            <option value="">Chọn dự án...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.name}
              </option>
            ))}
          </select>
        </FieldGroup>

        {/* Type and Category */}
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Loại giao dịch" error={fieldErrors.type} required>
            <select
              name="type"
              defaultValue={defaultValues?.type ?? ''}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                fieldErrors.type ? 'border-red-300' : 'border-gray-300',
              )}
            >
              <option value="">Chọn loại...</option>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Danh mục" error={fieldErrors.category}>
            <select
              name="category"
              defaultValue={defaultValues?.category ?? 'other'}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FieldGroup>
        </div>

        {/* Amount (VND) */}
        <FieldGroup label="Số tiền (VND)" error={fieldErrors.amount} required>
          <VndAmountInput
            value={amountRaw}
            onChange={setAmountRaw}
            error={fieldErrors.amount}
          />
        </FieldGroup>

        {/* Description */}
        <FieldGroup label="Mô tả" error={fieldErrors.description} required>
          <textarea
            name="description"
            defaultValue={defaultValues?.description ?? ''}
            rows={3}
            placeholder="Mô tả giao dịch..."
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.description ? 'border-red-300' : 'border-gray-300',
            )}
          />
        </FieldGroup>

        {/* Transaction Date */}
        <FieldGroup label="Ngày giao dịch" error={fieldErrors.transactionDate} required>
          <input
            type="date"
            name="transactionDate"
            defaultValue={defaultValues?.transactionDate ?? new Date().toISOString().slice(0, 10)}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.transactionDate ? 'border-red-300' : 'border-gray-300',
            )}
          />
        </FieldGroup>

        {/* Reference Number */}
        <FieldGroup label="Mã tham chiếu" error={fieldErrors.referenceNumber}>
          <input
            type="text"
            name="referenceNumber"
            defaultValue={defaultValues?.referenceNumber ?? ''}
            placeholder="Ví dụ: INV-2026-001 (tùy chọn)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FieldGroup>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

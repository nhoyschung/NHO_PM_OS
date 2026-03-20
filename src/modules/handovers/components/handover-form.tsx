'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createHandoverSchema } from '../validation';
import { TYPE_LABELS } from '../constants';
import type { HandoverType, HandoverFormData } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface ChecklistRowData {
  title: string;
  description: string;
  category: string;
  priority: string;
  requiresEvidence: boolean;
}

interface HandoverFormProps {
  defaultValues?: Partial<HandoverFormData>;
  onSubmit: (data: HandoverFormData) => Promise<{ success: boolean; data?: { id: string }; error?: string }>;
  title: string;
  projects?: Array<{ id: string; name: string; code: string }>;
  users?: Array<{ id: string; fullName: string | null; email: string }>;
}

// ── Component ───────────────────────────────────────────────────

export function HandoverForm({
  defaultValues,
  onSubmit,
  title,
  projects = [],
  users = [],
}: HandoverFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const formData = new FormData(e.currentTarget);

    const raw = {
      projectId: formData.get('projectId') as string,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      type: (formData.get('type') as string) || 'project_transfer',
      toUserId: formData.get('toUserId') as string,
      fromDepartmentId: (formData.get('fromDepartmentId') as string) || undefined,
      toDepartmentId: (formData.get('toDepartmentId') as string) || undefined,
      fromStage: (formData.get('fromStage') as string) || undefined,
      toStage: (formData.get('toStage') as string) || undefined,
      dueDate: (formData.get('dueDate') as string) ? new Date(formData.get('dueDate') as string).toISOString() : undefined,
      notes: (formData.get('notes') as string) || undefined,
    };

    const result = createHandoverSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const response = await onSubmit(result.data);
      if (!response.success) {
        setServerError(response.error ?? 'Đã xảy ra lỗi. Vui lòng thử lại.');
      } else if (response.data?.id) {
        router.push(`/dashboard/handovers/${response.data.id}`);
      } else {
        router.push('/dashboard/handovers');
      }
    });
  };

  const typeOptions = Object.entries(TYPE_LABELS) as Array<[HandoverType, string]>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/handovers"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-5">
          {/* Title */}
          <FieldGroup label="Tiêu đề bàn giao" htmlFor="title" required error={errors['title']}>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={defaultValues?.title ?? ''}
              placeholder="Nhập tiêu đề bàn giao"
              className={cn(
                'w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1',
                errors['title']
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              )}
            />
          </FieldGroup>

          {/* Project selector */}
          <FieldGroup label="Dự án" htmlFor="projectId" required error={errors['projectId']}>
            <select
              id="projectId"
              name="projectId"
              defaultValue={defaultValues?.projectId ?? ''}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Chọn dự án...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </FieldGroup>

          {/* Type and To user row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Loại bàn giao" htmlFor="type" required error={errors['type']}>
              <select
                id="type"
                name="type"
                defaultValue={defaultValues?.type ?? 'project_transfer'}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {typeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup label="Người nhận" htmlFor="toUserId" required error={errors['toUserId']}>
              <select
                id="toUserId"
                name="toUserId"
                defaultValue={defaultValues?.toUserId ?? ''}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Chọn người nhận...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName ?? u.email}
                  </option>
                ))}
              </select>
            </FieldGroup>
          </div>

          {/* Description */}
          <FieldGroup label="Mô tả" htmlFor="description" error={errors['description']}>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={defaultValues?.description ?? ''}
              placeholder="Mô tả chi tiết về bàn giao..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FieldGroup>

          {/* Due date */}
          <FieldGroup label="Hạn chót" htmlFor="dueDate" error={errors['dueDate']}>
            <input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              defaultValue={defaultValues?.dueDate ? defaultValues.dueDate.slice(0, 16) : ''}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FieldGroup>

          {/* Notes */}
          <FieldGroup label="Ghi chú" htmlFor="notes" error={errors['notes']}>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={defaultValues?.notes ?? ''}
              placeholder="Ghi chú thêm..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FieldGroup>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
          <Link
            href="/dashboard/handovers"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Field Group ─────────────────────────────────────────────────

function FieldGroup({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

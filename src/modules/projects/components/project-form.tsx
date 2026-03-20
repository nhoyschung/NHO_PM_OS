'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createProjectSchema } from '../validation';
import { PROVINCES, PRIORITY_LABELS, PRIORITY_COLORS } from '../constants';
import type { ProjectPriority, ProjectFormData } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface ProjectFormProps {
  /** When provided, the form is in edit mode. */
  defaultValues?: Partial<ProjectFormData>;
  /** Server action to call on submit. */
  onSubmit: (data: ProjectFormData) => Promise<{ success: boolean; data?: { slug: string }; error?: string }>;
  /** Title displayed at the top. */
  title: string;
}

// ── Component ─────────────────────────────────────────────────────

export function ProjectForm({ defaultValues, onSubmit, title }: ProjectFormProps) {
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
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      category: (formData.get('category') as string) || undefined,
      priority: (formData.get('priority') as string) || 'medium',
      province: (formData.get('province') as string) || undefined,
      district: (formData.get('district') as string) || undefined,
      startDate: (formData.get('startDate') as string) || undefined,
      endDate: (formData.get('endDate') as string) || undefined,
      budget: formData.get('budget') ? Number(formData.get('budget')) : undefined,
      currency: 'VND',
      tags: [] as string[],
    };

    // Client-side validation
    const result = createProjectSchema.safeParse(raw);
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
      } else if (response.data?.slug) {
        router.push(`/dashboard/projects/${response.data.slug}`);
      } else {
        router.push('/dashboard/projects');
      }
    });
  };

  const priorityOptions = Object.entries(PRIORITY_LABELS) as Array<[ProjectPriority, string]>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/projects"
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
          {/* Name */}
          <FieldGroup label="Tên dự án" htmlFor="name" required error={errors['name']}>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={defaultValues?.name ?? ''}
              placeholder="Nhập tên dự án"
              className={cn(
                'w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1',
                errors['name']
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              )}
            />
          </FieldGroup>

          {/* Province */}
          <FieldGroup label="Tỉnh/Thành phố" htmlFor="province" error={errors['province']}>
            <select
              id="province"
              name="province"
              defaultValue={defaultValues?.province ?? ''}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Chọn tỉnh/thành phố...</option>
              {PROVINCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          {/* Description */}
          <FieldGroup label="Mô tả" htmlFor="description" error={errors['description']}>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={defaultValues?.description ?? ''}
              placeholder="Mô tả chi tiết về dự án..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FieldGroup>

          {/* Date row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Ngày bắt đầu" htmlFor="startDate" error={errors['startDate']}>
              <input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={defaultValues?.startDate ?? ''}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </FieldGroup>

            <FieldGroup
              label="Ngày kết thúc dự kiến"
              htmlFor="endDate"
              error={errors['endDate']}
            >
              <input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={defaultValues?.endDate ?? ''}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </FieldGroup>
          </div>

          {/* Budget + Priority row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Ngân sách (VND)" htmlFor="budget" error={errors['budget']}>
              <input
                id="budget"
                name="budget"
                type="number"
                min={0}
                step={1000}
                defaultValue={defaultValues?.budget ?? ''}
                placeholder="0"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </FieldGroup>

            <FieldGroup label="Ưu tiên" htmlFor="priority" error={errors['priority']}>
              <select
                id="priority"
                name="priority"
                defaultValue={defaultValues?.priority ?? 'medium'}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {priorityOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldGroup>
          </div>

          {/* Category */}
          <FieldGroup label="Danh mục" htmlFor="category" error={errors['category']}>
            <input
              id="category"
              name="category"
              type="text"
              defaultValue={defaultValues?.category ?? ''}
              placeholder="Ví dụ: Xây dựng, CNTT, Giáo dục..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FieldGroup>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
          <Link
            href="/dashboard/projects"
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

// ── Field Group ───────────────────────────────────────────────────

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

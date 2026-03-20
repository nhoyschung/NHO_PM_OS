'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  VALIDATION,
} from '../constants';
import { uploadDocumentSchema } from '../validation';
import type { DocumentFormData, DocumentType, DocumentStatus } from '../types';

// ── FieldGroup helper ─────────────────────────────────────────────

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
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────

interface DocumentUploadFormProps {
  defaultValues?: Partial<DocumentFormData>;
  onSubmit: (data: DocumentFormData) => Promise<{ success: boolean; error?: string }>;
  title?: string;
}

const TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS) as Array<[DocumentType, string]>;
const STATUS_OPTIONS = Object.entries(DOCUMENT_STATUS_LABELS) as Array<[DocumentStatus, string]>;

// ── Component ─────────────────────────────────────────────────────

export function DocumentUploadForm({
  defaultValues,
  onSubmit,
  title = 'Tạo tài liệu mới',
}: DocumentUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const raw: DocumentFormData = {
      title: String(formData.get('title') ?? ''),
      description: (formData.get('description') as string) || undefined,
      type: (formData.get('type') as DocumentType) || 'other',
      status: (formData.get('status') as DocumentStatus) || 'draft',
      projectId: (formData.get('projectId') as string) || undefined,
      handoverId: (formData.get('handoverId') as string) || undefined,
      content: (formData.get('content') as string) || undefined,
      tags: (formData.get('tags') as string)
        ? (formData.get('tags') as string)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };

    const parsed = uploadDocumentSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key && !errors[String(key)]) {
          errors[String(key)] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setServerError(null);

    startTransition(async () => {
      const result = await onSubmit(parsed.data);
      if (!result.success) {
        setServerError(result.error ?? 'Đã xảy ra lỗi. Vui lòng thử lại.');
      } else {
        router.push('/dashboard/documents');
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{title}</h1>

        {serverError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <FieldGroup label="Tiêu đề" error={fieldErrors.title} required>
            <input
              type="text"
              name="title"
              defaultValue={defaultValues?.title}
              maxLength={VALIDATION.TITLE_MAX}
              placeholder="Nhập tiêu đề tài liệu..."
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                fieldErrors.title ? 'border-red-400' : 'border-gray-300',
              )}
            />
          </FieldGroup>

          {/* Description */}
          <FieldGroup label="Mô tả" error={fieldErrors.description}>
            <textarea
              name="description"
              defaultValue={defaultValues?.description}
              maxLength={VALIDATION.DESCRIPTION_MAX}
              rows={3}
              placeholder="Mô tả tài liệu..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FieldGroup>

          {/* Type + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Loại tài liệu" error={fieldErrors.type} required>
              <select
                name="type"
                defaultValue={defaultValues?.type ?? 'other'}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  fieldErrors.type ? 'border-red-400' : 'border-gray-300',
                )}
              >
                {TYPE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup label="Trạng thái" error={fieldErrors.status}>
              <select
                name="status"
                defaultValue={defaultValues?.status ?? 'draft'}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldGroup>
          </div>

          {/* Content */}
          <FieldGroup label="Nội dung (văn bản)" error={fieldErrors.content}>
            <textarea
              name="content"
              defaultValue={defaultValues?.content}
              rows={6}
              placeholder="Nội dung tài liệu (tùy chọn)..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FieldGroup>

          {/* Tags */}
          <FieldGroup label="Nhãn (phân cách bằng dấu phẩy)" error={fieldErrors.tags}>
            <input
              type="text"
              name="tags"
              defaultValue={
                defaultValues?.tags ? defaultValues.tags.join(', ') : ''
              }
              placeholder="hợp đồng, kỹ thuật, bàn giao..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FieldGroup>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Đang lưu...' : 'Lưu tài liệu'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

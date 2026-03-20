'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTaskSchema } from '../validation';
import {
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '../constants';
import type { TaskFormData, TaskType, TaskPriority, TaskStatus } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface TaskFormProps {
  defaultValues?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => Promise<{ success: boolean; error?: string }>;
  title: string;
  /** Pre-populated project options for the selector */
  projectOptions?: Array<{ id: string; name: string; code: string }>;
  /** Pre-populated user options for the assignee selector */
  userOptions?: Array<{ id: string; name: string; email: string }>;
}

// ── FieldGroup helper ─────────────────────────────────────────────

function FieldGroup({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export function TaskForm({
  defaultValues,
  onSubmit,
  title,
  projectOptions = [],
  userOptions = [],
}: TaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const inputClass =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const raw: Record<string, unknown> = {
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      projectId: formData.get('projectId'),
      type: formData.get('type'),
      priority: formData.get('priority'),
      status: formData.get('status'),
      assigneeId: formData.get('assigneeId') || undefined,
      projectStage: formData.get('projectStage') || undefined,
      startDate: formData.get('startDate') || undefined,
      dueDate: formData.get('dueDate') || undefined,
      estimatedHours: formData.get('estimatedHours')
        ? Number(formData.get('estimatedHours'))
        : undefined,
      tags: [],
    };

    // Client-side validation
    const parsed = createTaskSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !errors[field]) {
          errors[field] = issue.message;
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
        setServerError(result.error ?? 'Đã xảy ra lỗi.');
      } else {
        router.push('/dashboard/tasks');
      }
    });
  };

  const TYPE_OPTIONS = Object.entries(TASK_TYPE_LABELS) as Array<[TaskType, string]>;
  const PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LABELS) as Array<[TaskPriority, string]>;
  const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS) as Array<[TaskStatus, string]>;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        {/* Title */}
        <FieldGroup label="Tiêu đề" htmlFor="title" error={fieldErrors.title} required>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={defaultValues?.title}
            placeholder="Nhập tiêu đề công việc..."
            className={inputClass}
            disabled={isPending}
          />
        </FieldGroup>

        {/* Description */}
        <FieldGroup label="Mô tả" htmlFor="description" error={fieldErrors.description}>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={defaultValues?.description}
            placeholder="Mô tả chi tiết công việc..."
            className={inputClass}
            disabled={isPending}
          />
        </FieldGroup>

        {/* Project selector */}
        <FieldGroup label="Dự án" htmlFor="projectId" error={fieldErrors.projectId} required>
          <select
            id="projectId"
            name="projectId"
            defaultValue={defaultValues?.projectId}
            className={inputClass}
            disabled={isPending}
          >
            <option value="">Chọn dự án...</option>
            {projectOptions.map((proj) => (
              <option key={proj.id} value={proj.id}>
                [{proj.code}] {proj.name}
              </option>
            ))}
          </select>
        </FieldGroup>

        {/* Type + Priority row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Loại" htmlFor="type" error={fieldErrors.type}>
            <select
              id="type"
              name="type"
              defaultValue={defaultValues?.type ?? 'feature'}
              className={inputClass}
              disabled={isPending}
            >
              {TYPE_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Ưu tiên" htmlFor="priority" error={fieldErrors.priority}>
            <select
              id="priority"
              name="priority"
              defaultValue={defaultValues?.priority ?? 'medium'}
              className={inputClass}
              disabled={isPending}
            >
              {PRIORITY_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </FieldGroup>
        </div>

        {/* Status */}
        <FieldGroup label="Trạng thái" htmlFor="status" error={fieldErrors.status}>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? 'backlog'}
            className={inputClass}
            disabled={isPending}
          >
            {STATUS_OPTIONS.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </FieldGroup>

        {/* Assignee */}
        <FieldGroup label="Người được giao" htmlFor="assigneeId" error={fieldErrors.assigneeId}>
          <select
            id="assigneeId"
            name="assigneeId"
            defaultValue={defaultValues?.assigneeId}
            className={inputClass}
            disabled={isPending}
          >
            <option value="">Chọn người phụ trách...</option>
            {userOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </FieldGroup>

        {/* Start date + Due date row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Ngày bắt đầu" htmlFor="startDate" error={fieldErrors.startDate}>
            <input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={defaultValues?.startDate}
              className={inputClass}
              disabled={isPending}
            />
          </FieldGroup>

          <FieldGroup label="Hạn chót" htmlFor="dueDate" error={fieldErrors.dueDate}>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={defaultValues?.dueDate}
              className={inputClass}
              disabled={isPending}
            />
          </FieldGroup>
        </div>

        {/* Estimated hours */}
        <FieldGroup
          label="Giờ ước tính"
          htmlFor="estimatedHours"
          error={fieldErrors.estimatedHours}
        >
          <input
            id="estimatedHours"
            name="estimatedHours"
            type="number"
            min={0}
            defaultValue={defaultValues?.estimatedHours}
            placeholder="0"
            className={inputClass}
            disabled={isPending}
          />
        </FieldGroup>

        {/* Server error */}
        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

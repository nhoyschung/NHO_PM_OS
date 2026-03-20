'use client';

import { useState, useTransition, useCallback } from 'react';
import { FileDown, Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateReport } from '../actions';
import type { GenerateReportResult } from '../actions';
import { REPORT_TYPE_LABELS, EXPORT_FORMAT_LABELS } from '../constants';
import type { ReportType, ExportFormat } from '../types';
import { ReportPreview } from './report-preview';

// ── Column definitions for preview (mirrors actions.ts) ─────────

const PREVIEW_COLUMNS: Record<ReportType, { key: string; header: string }[]> = {
  project_summary: [
    { key: 'projectCode', header: 'Mã dự án' },
    { key: 'projectName', header: 'Tên dự án' },
    { key: 'stage', header: 'Giai đoạn' },
    { key: 'priority', header: 'Ưu tiên' },
    { key: 'progressPercentage', header: 'Tiến độ (%)' },
    { key: 'taskCount', header: 'Số công việc' },
  ],
  finance_summary: [
    { key: 'projectName', header: 'Dự án' },
    { key: 'type', header: 'Loại' },
    { key: 'category', header: 'Danh mục' },
    { key: 'totalAmount', header: 'Tổng số tiền' },
    { key: 'recordCount', header: 'Số bản ghi' },
  ],
  task_completion: [
    { key: 'projectName', header: 'Dự án' },
    { key: 'totalTasks', header: 'Tổng' },
    { key: 'doneTasks', header: 'Hoàn thành' },
    { key: 'inProgressTasks', header: 'Đang làm' },
    { key: 'overdueTasks', header: 'Quá hạn' },
    { key: 'completionRate', header: 'Tỷ lệ (%)' },
  ],
  handover_status: [
    { key: 'projectName', header: 'Dự án' },
    { key: 'handoverTitle', header: 'Bàn giao' },
    { key: 'type', header: 'Loại' },
    { key: 'status', header: 'Trạng thái' },
    { key: 'fromUserName', header: 'Người giao' },
    { key: 'toUserName', header: 'Người nhận' },
  ],
};

// ── Props ────────────────────────────────────────────────────────

interface ReportGeneratorProps {
  projects: { id: string; name: string }[];
}

// ── Component ────────────────────────────────────────────────────

export function ReportGenerator({ projects }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('project_summary');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerateReportResult | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    setError(null);
    setResult(null);
    setPreviewRows([]);

    startTransition(async () => {
      const response = await generateReport({
        type: reportType,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        projectId: projectId || undefined,
        format,
      });

      if (!response.success) {
        setError(response.error);
        return;
      }

      setResult(response.data);

      // Parse preview rows from the generated content
      if (format === 'json') {
        try {
          const parsed = JSON.parse(response.data.content);
          setPreviewRows(parsed.rows ?? []);
        } catch {
          setPreviewRows([]);
        }
      }
    });
  }, [reportType, format, dateFrom, dateTo, projectId]);

  const handleDownload = useCallback(() => {
    if (!result) return;

    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="space-y-6">
      {/* ── Config Form ───────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Tạo báo cáo</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Report Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Loại báo cáo
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {(Object.entries(REPORT_TYPE_LABELS) as [ReportType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Dự án <span className="text-gray-400">(tùy chọn)</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả dự án</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Từ ngày <span className="text-gray-400">(tùy chọn)</span>
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Đến ngày <span className="text-gray-400">(tùy chọn)</span>
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Format + Generate */}
        <div className="mt-4 flex items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Định dạng
            </label>
            <div className="flex gap-2">
              {(Object.entries(EXPORT_FORMAT_LABELS) as [ExportFormat, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormat(value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      format === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {value === 'csv' ? (
                      <FileSpreadsheet className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Tạo báo cáo
          </button>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Result + Download ─────────────────────────────────── */}
      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                Báo cáo đã tạo thành công — {result.rowCount} dòng dữ liệu
              </p>
              <p className="mt-1 text-xs text-green-600">{result.filename}</p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
            >
              <FileDown className="h-4 w-4" />
              Tải xuống
            </button>
          </div>
        </div>
      )}

      {/* ── Preview (JSON only — CSV is text, preview from rows) */}
      {format === 'json' && previewRows.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">Xem trước dữ liệu</h3>
          <ReportPreview
            columns={PREVIEW_COLUMNS[reportType]}
            rows={previewRows}
            formatters={{
              totalAmount: (v) =>
                typeof v === 'number'
                  ? new Intl.NumberFormat('vi-VN').format(v)
                  : String(v ?? ''),
            }}
          />
        </div>
      )}
    </div>
  );
}

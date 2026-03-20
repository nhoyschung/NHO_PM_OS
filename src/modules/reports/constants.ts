import type { ReportType, ExportFormat } from './types';

// ── Report Type Labels (Vietnamese) ─────────────────────────────
// Source: Task specification — Vietnamese UI labels

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  project_summary: 'Tổng hợp dự án',
  finance_summary: 'Tổng hợp tài chính',
  task_completion: 'Tiến độ công việc',
  handover_status: 'Tình trạng bàn giao',
};

// ── Export Format Labels (Vietnamese) ───────────────────────────

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV (Excel)',
  json: 'JSON',
};

// ── UTF-8 BOM for Excel Compatibility ──────────────────────────

export const UTF8_BOM = '\uFEFF';

// ── Pagination ─────────────────────────────────────────────────

export const REPORT_MAX_ROWS = 10000;

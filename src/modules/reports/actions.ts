'use server';

import { createAction, ok, err, type ActionResult } from '@/lib/action';
import { ReportConfigSchema } from './types';
import type { ReportConfig, CsvColumn } from './types';
import {
  getProjectSummaryReport,
  getFinanceSummaryReport,
  getTaskCompletionReport,
  getHandoverStatusReport,
} from './queries';
import { REPORT_TYPE_LABELS } from './constants';
import { exportToCsv } from './csv-utils';

// ── VND Formatting for CSV ──────────────────────────────────────

function formatVnd(amount: unknown): string {
  if (typeof amount !== 'number' || amount === 0) return '0';
  return new Intl.NumberFormat('vi-VN').format(amount);
}

// ── Column Definitions per Report Type ──────────────────────────

const PROJECT_SUMMARY_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: 'projectCode', header: 'Mã dự án' },
  { key: 'projectName', header: 'Tên dự án' },
  { key: 'stage', header: 'Giai đoạn' },
  { key: 'priority', header: 'Ưu tiên' },
  { key: 'healthStatus', header: 'Tình trạng' },
  { key: 'progressPercentage', header: 'Tiến độ (%)' },
  { key: 'budget', header: 'Ngân sách (VND)', format: formatVnd },
  { key: 'budgetSpent', header: 'Đã chi (VND)', format: formatVnd },
  { key: 'taskCount', header: 'Số công việc' },
  { key: 'startDate', header: 'Ngày bắt đầu' },
  { key: 'endDate', header: 'Ngày kết thúc' },
];

const FINANCE_SUMMARY_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: 'projectName', header: 'Dự án' },
  { key: 'type', header: 'Loại' },
  { key: 'category', header: 'Danh mục' },
  { key: 'totalAmount', header: 'Tổng số tiền (VND)', format: formatVnd },
  { key: 'recordCount', header: 'Số bản ghi' },
  { key: 'currency', header: 'Tiền tệ' },
];

const TASK_COMPLETION_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: 'projectName', header: 'Dự án' },
  { key: 'totalTasks', header: 'Tổng công việc' },
  { key: 'doneTasks', header: 'Hoàn thành' },
  { key: 'inProgressTasks', header: 'Đang thực hiện' },
  { key: 'overdueTasks', header: 'Quá hạn' },
  { key: 'completionRate', header: 'Tỷ lệ hoàn thành (%)' },
];

const HANDOVER_STATUS_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: 'projectName', header: 'Dự án' },
  { key: 'handoverTitle', header: 'Tiêu đề bàn giao' },
  { key: 'type', header: 'Loại' },
  { key: 'status', header: 'Trạng thái' },
  { key: 'fromUserName', header: 'Người giao' },
  { key: 'toUserName', header: 'Người nhận' },
  { key: 'dueDate', header: 'Hạn chót', format: (v) => (v instanceof Date ? v.toISOString().split('T')[0] : String(v ?? '')) },
  { key: 'createdAt', header: 'Ngày tạo', format: (v) => (v instanceof Date ? v.toISOString().split('T')[0] : String(v ?? '')) },
];

const COLUMN_MAP: Record<string, CsvColumn<Record<string, unknown>>[]> = {
  project_summary: PROJECT_SUMMARY_COLUMNS,
  finance_summary: FINANCE_SUMMARY_COLUMNS,
  task_completion: TASK_COMPLETION_COLUMNS,
  handover_status: HANDOVER_STATUS_COLUMNS,
};

// ── generateReport ──────────────────────────────────────────────

export interface GenerateReportResult {
  content: string;
  filename: string;
  mimeType: string;
  rowCount: number;
}

export const generateReport = createAction(
  async (
    config: ReportConfig,
    _userId: string,
  ): Promise<ActionResult<GenerateReportResult>> => {
    const parsed = ReportConfigSchema.safeParse(config);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Cấu hình báo cáo không hợp lệ.');
    }

    const { type, dateFrom, dateTo, projectId, format } = parsed.data;

    // Fetch report data based on type
    let rows: Record<string, unknown>[];
    let rowCount: number;

    switch (type) {
      case 'project_summary': {
        const result = await getProjectSummaryReport(dateFrom, dateTo, projectId);
        rows = result.rows as unknown as Record<string, unknown>[];
        rowCount = result.rowCount;
        break;
      }
      case 'finance_summary': {
        const result = await getFinanceSummaryReport(dateFrom, dateTo, projectId);
        rows = result.rows as unknown as Record<string, unknown>[];
        rowCount = result.rowCount;
        break;
      }
      case 'task_completion': {
        const result = await getTaskCompletionReport(dateFrom, dateTo, projectId);
        rows = result.rows as unknown as Record<string, unknown>[];
        rowCount = result.rowCount;
        break;
      }
      case 'handover_status': {
        const result = await getHandoverStatusReport(dateFrom, dateTo, projectId);
        rows = result.rows as unknown as Record<string, unknown>[];
        rowCount = result.rowCount;
        break;
      }
      default:
        return err('Loại báo cáo không hợp lệ.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const typeLabel = REPORT_TYPE_LABELS[type].replace(/\s+/g, '_');

    if (format === 'json') {
      return ok({
        content: JSON.stringify({ type, generatedAt: new Date().toISOString(), rowCount, rows }, null, 2),
        filename: `${typeLabel}_${timestamp}.json`,
        mimeType: 'application/json',
        rowCount,
      });
    }

    // CSV format
    const columns = COLUMN_MAP[type];
    if (!columns) {
      return err('Không tìm thấy cấu hình cột cho loại báo cáo này.');
    }

    const csvContent = exportToCsv(rows, columns);

    return ok({
      content: csvContent,
      filename: `${typeLabel}_${timestamp}.csv`,
      mimeType: 'text/csv;charset=utf-8',
      rowCount,
    });
  },
);

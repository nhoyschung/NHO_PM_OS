import { z } from 'zod';

// ── Report Type ─────────────────────────────────────────────────

export const ReportType = z.enum([
  'project_summary',
  'finance_summary',
  'task_completion',
  'handover_status',
]);
export type ReportType = z.infer<typeof ReportType>;

// ── Export Format ───────────────────────────────────────────────

export const ExportFormat = z.enum(['csv', 'json']);
export type ExportFormat = z.infer<typeof ExportFormat>;

// ── Report Config ───────────────────────────────────────────────

export const ReportConfigSchema = z.object({
  type: ReportType,
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  projectId: z.string().uuid().optional(),
  format: ExportFormat.default('csv'),
});
export type ReportConfig = z.infer<typeof ReportConfigSchema>;

// ── Report Row Types ────────────────────────────────────────────

export interface ProjectSummaryRow {
  projectId: string;
  projectName: string;
  projectCode: string;
  stage: string;
  priority: string;
  healthStatus: string | null;
  progressPercentage: number | null;
  budget: number | null;
  budgetSpent: number | null;
  currency: string;
  taskCount: number;
  startDate: string | null;
  endDate: string | null;
}

export interface FinanceSummaryRow {
  projectId: string;
  projectName: string;
  type: string;
  category: string;
  totalAmount: number;
  recordCount: number;
  currency: string;
}

export interface TaskCompletionRow {
  projectId: string;
  projectName: string;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface HandoverStatusRow {
  projectId: string;
  projectName: string;
  handoverId: string;
  handoverTitle: string;
  type: string;
  status: string;
  fromUserName: string | null;
  toUserName: string | null;
  dueDate: Date | null;
  createdAt: Date;
}

// ── Report Result (generic wrapper) ────────────────────────────

export interface ReportResult<T> {
  type: ReportType;
  generatedAt: string;
  rowCount: number;
  rows: T[];
}

// ── CSV Column Definition ──────────────────────────────────────

export interface CsvColumn<T> {
  key: keyof T;
  header: string;
  format?: (value: unknown) => string;
}

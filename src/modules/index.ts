// ── Modules Barrel Export ─────────────────────────────────────────
// Aggregates all module public APIs for convenient cross-module imports.
// Note: Server actions ('use server') and queries should be imported
// directly from their respective module files (e.g., '@/modules/projects/actions').

// ── Projects ─────────────────────────────────────────────────────
export {
  ProjectList,
  ProjectDetail,
  ProjectForm,
  StageTransitionBar,
  StageBadge,
  PriorityBadge,
  HealthBadge,
} from './projects';

// ── Handovers ────────────────────────────────────────────────────
export {
  HandoverList,
  HandoverDetail,
  HandoverForm,
  StatusBadge as HandoverStatusBadge,
  TypeBadge as HandoverTypeBadge,
} from './handovers';

// ── Documents ────────────────────────────────────────────────────
export {
  DocumentList,
  DocumentDetail,
  DocumentUploadForm,
  DocumentTypeBadge,
  DocumentStatusBadge,
} from './documents';

// ── Tasks ────────────────────────────────────────────────────────
export {
  TaskList,
  TaskDetail,
  TaskForm,
  TaskKanban,
  TaskStatusBadge,
  TaskPriorityBadge,
} from './tasks';

// ── Notifications ────────────────────────────────────────────────
export {
  NotificationList,
  NotificationBell,
  NotificationItem,
} from './notifications';

// ── Audit Logs ───────────────────────────────────────────────────
export {
  AuditLogList,
  AuditLogFilters,
  AuditLogTimeline,
  ActionBadge,
  SeverityBadge,
} from './audit-logs';

// ── Finance ──────────────────────────────────────────────────────
export {
  FinanceList,
  FinanceDetail,
  FinanceForm,
  FinanceSummaryCards,
  FinanceCsvImport,
} from './finance';

// ── Dashboard ────────────────────────────────────────────────────
export {
  StatCards,
  ProjectStageChart,
  TaskOverview,
  RecentActivity,
} from './dashboard';

// ── Compliance ──────────────────────────────────────────────────
export { ComplianceDashboard } from './compliance';

// ── Shared ───────────────────────────────────────────────────────
export { PermissionGuard } from './shared/permission-guard';

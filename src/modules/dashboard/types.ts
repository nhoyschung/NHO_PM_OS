import type { ProjectStats } from '@/modules/projects/queries';
import type { TaskStats } from '@/modules/tasks/queries';
import type { FinanceSummary } from '@/modules/finance/types';
import type { AuditLogListItem } from '@/modules/audit-logs/types';

// ── Stat Card Data ──────────────────────────────────────────────

export interface StatCardData {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
}

// ── Dashboard Stats (aggregated from all modules) ───────────────

export interface DashboardStats {
  projects: ProjectStats;
  tasks: TaskStats;
  finance: FinanceSummary;
  pendingHandovers: number;
  recentActivity: AuditLogListItem[];
}

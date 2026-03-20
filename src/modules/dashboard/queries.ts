import { eq, and, count, sql } from 'drizzle-orm';
import { db } from '@/db';
import { handovers } from '@/db/schema';
import { getProjectStats } from '@/modules/projects/queries';
import { getTaskStats } from '@/modules/tasks/queries';
import { getFinanceSummary } from '@/modules/finance/queries';
import { getRecentActivity } from '@/modules/audit-logs/queries';
import type { DashboardStats } from './types';

// ── getDashboardStats ──────────────────────────────────────────
// Aggregates stats from all modules in a single parallel fetch.

export async function getDashboardStats(): Promise<DashboardStats> {
  const [projects, tasks, finance, pendingResult, recentActivity] = await Promise.all([
    getProjectStats(),
    getTaskStats(),
    getFinanceSummary(),
    db
      .select({ value: count() })
      .from(handovers)
      .where(
        sql`${handovers.status} IN ('pending_review', 'in_review')`,
      ),
    getRecentActivity(10),
  ]);

  return {
    projects,
    tasks,
    finance,
    pendingHandovers: pendingResult[0]?.value ?? 0,
    recentActivity,
  };
}

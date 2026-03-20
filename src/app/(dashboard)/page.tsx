import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { getDashboardStats } from '@/modules/dashboard/queries';
import { isRoleAtLeast } from '@/lib/rbac';
import {
  StatCards,
  ProjectStageChart,
  TaskOverview,
  RecentActivity,
} from '@/modules/dashboard/components';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const stats = await getDashboardStats();

  // RBAC: admin/manager see all stats; others see limited view
  const isManagement = isRoleAtLeast(user.role, 'manager');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground">
          Chào mừng trở lại. Đây là tổng quan hoạt động của hệ thống.
        </p>
      </div>

      {/* Stat Cards */}
      <StatCards stats={stats} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectStageChart countByStage={stats.projects.countByStage} />
        <TaskOverview taskStats={stats.tasks} />
      </div>

      {/* Recent Activity — visible to management roles */}
      {isManagement && (
        <RecentActivity activities={stats.recentActivity} />
      )}
    </div>
  );
}

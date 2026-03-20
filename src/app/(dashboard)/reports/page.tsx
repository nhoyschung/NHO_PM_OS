import { db } from '@/db';
import { projects } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { ReportGenerator } from '@/modules/reports/components/report-generator';

export default async function ReportsPage() {
  // Fetch project list for the filter dropdown
  const projectList = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.isArchived, false))
    .orderBy(projects.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tạo và tải xuống báo cáo tổng hợp dự án, tài chính, công việc và bàn giao.
        </p>
      </div>

      <ReportGenerator projects={projectList} />
    </div>
  );
}

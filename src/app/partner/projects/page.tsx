import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { getProjectsByMember } from '@/modules/compliance/partner-queries';
import { PartnerProjectList } from '@/modules/compliance/components/partner-project-list';

export default async function PartnerProjectsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const projects = await getProjectsByMember(user.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dự án</h1>
        <p className="text-muted-foreground">
          Danh sách dự án bạn đang tham gia.
        </p>
      </div>

      {/* Read-only project list — no create button */}
      <PartnerProjectList projects={projects} />
    </div>
  );
}

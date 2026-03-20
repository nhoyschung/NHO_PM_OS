import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { getProjectById } from '@/modules/projects/queries';
import { getDocumentsByProject } from '@/modules/documents/queries';
import { getHandoversByProject } from '@/modules/handovers/queries';
import { isProjectMember } from '@/modules/compliance/partner-queries';
import { PartnerProjectDetail } from '@/modules/compliance/components/partner-project-detail';

interface PartnerProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerProjectDetailPage({
  params,
}: PartnerProjectDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Verify the user is a member of this project
  const isMember = await isProjectMember(id, user.id);
  if (!isMember) {
    redirect('/partner/projects');
  }

  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  // Fetch only allowed tab data: documents + handovers (no tasks, finance, audit)
  const [documentsResult, handoversResult] = await Promise.all([
    getDocumentsByProject(project.id),
    getHandoversByProject(project.id),
  ]);

  return (
    <PartnerProjectDetail
      project={project}
      documents={documentsResult.data}
      handovers={handoversResult.data}
    />
  );
}

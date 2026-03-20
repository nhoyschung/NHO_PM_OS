import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/modules/projects/queries';
import { getHandoversByProject } from '@/modules/handovers/queries';
import { getDocumentsByProject } from '@/modules/documents/queries';
import { getTasksByProject } from '@/modules/tasks/queries';
import { getFinanceByProject, getFinanceSummary } from '@/modules/finance/queries';
import { getAuditLogsByEntity } from '@/modules/audit-logs/queries';
import { ProjectDetailClient } from './project-detail-client';

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Fetch all tab data in parallel
  const [handoversResult, documentsResult, tasksResult, financeResult, financeSummary, auditLogs] =
    await Promise.all([
      getHandoversByProject(project.id),
      getDocumentsByProject(project.id),
      getTasksByProject(project.id),
      getFinanceByProject(project.id),
      getFinanceSummary(project.id),
      getAuditLogsByEntity('project', project.id, 50),
    ]);

  return (
    <ProjectDetailClient
      project={project}
      handovers={handoversResult.data}
      documents={documentsResult.data}
      tasks={tasksResult.data}
      financeRecords={financeResult.data}
      financeSummary={financeSummary}
      auditLogs={auditLogs}
    />
  );
}

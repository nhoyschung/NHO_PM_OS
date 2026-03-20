import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/modules/projects/queries';
import { getHandoversByProject } from '@/modules/handovers/queries';
import { getDocumentsByProject } from '@/modules/documents/queries';
import { getTasksByProject } from '@/modules/tasks/queries';
import { getFinanceByProject, getFinanceSummary } from '@/modules/finance/queries';
import { getAuditLogsByEntity } from '@/modules/audit-logs/queries';
import { ProjectDetailClient } from './project-detail-client';
import type { FinanceSummary } from '@/modules/finance/types';

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

const emptyPaginated = { data: [] as never[], total: 0, page: 1, perPage: 20, totalPages: 0 };
const emptySummary: FinanceSummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  totalRecords: 0,
};

async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('[ProjectDetail] Query failed:', error);
    return fallback;
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Fetch all tab data in parallel — each wrapped in safeCall to prevent
  // one module's query failure from breaking the entire page
  const [handoversResult, documentsResult, tasksResult, financeResult, financeSummary, auditLogs] =
    await Promise.all([
      safeCall(() => getHandoversByProject(project.id), emptyPaginated),
      safeCall(() => getDocumentsByProject(project.id), emptyPaginated),
      safeCall(() => getTasksByProject(project.id), emptyPaginated),
      safeCall(() => getFinanceByProject(project.id), emptyPaginated),
      safeCall(() => getFinanceSummary(project.id), emptySummary),
      safeCall(() => getAuditLogsByEntity('project', project.id, 50), []),
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

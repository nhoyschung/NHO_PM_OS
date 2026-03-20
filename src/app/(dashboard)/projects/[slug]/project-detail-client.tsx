'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectDetail } from '@/modules/projects/components/project-detail';
import { transitionStageAction } from '@/modules/projects/actions';
import type { ProjectDetail as ProjectDetailType, ProjectStage } from '@/modules/projects/types';
import type { HandoverListItem } from '@/modules/handovers/types';
import type { DocumentListItem } from '@/modules/documents/types';
import type { TaskListItem } from '@/modules/tasks/types';
import type { FinanceListItem, FinanceSummary } from '@/modules/finance/types';
import type { AuditLogListItem } from '@/modules/audit-logs/types';

interface ProjectDetailClientProps {
  project: ProjectDetailType;
  handovers: HandoverListItem[];
  documents: DocumentListItem[];
  tasks: TaskListItem[];
  financeRecords: FinanceListItem[];
  financeSummary: FinanceSummary;
  auditLogs: AuditLogListItem[];
}

export function ProjectDetailClient({
  project,
  handovers,
  documents,
  tasks,
  financeRecords,
  financeSummary,
  auditLogs,
}: ProjectDetailClientProps) {
  const router = useRouter();

  const handleTransition = useCallback(
    async (targetStage: ProjectStage, notes?: string) => {
      const result = await transitionStageAction({
        projectId: project.id,
        fromStage: project.stage as ProjectStage,
        targetStage,
        notes,
      });
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    [project.id, project.stage, router],
  );

  return (
    <ProjectDetail
      project={project}
      onTransition={handleTransition}
      handovers={handovers}
      documents={documents}
      tasks={tasks}
      financeRecords={financeRecords}
      financeSummary={financeSummary}
      auditLogs={auditLogs}
    />
  );
}

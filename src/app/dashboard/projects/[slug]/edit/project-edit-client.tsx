'use client';

import { useCallback } from 'react';
import { ProjectForm } from '@/modules/projects/components/project-form';
import { updateProjectAction } from '@/modules/projects/actions';
import type { ProjectFormData } from '@/modules/projects/types';

interface ProjectEditClientProps {
  projectId: string;
  defaultValues: Partial<ProjectFormData>;
}

export function ProjectEditClient({ projectId, defaultValues }: ProjectEditClientProps) {
  const handleSubmit = useCallback(
    async (data: ProjectFormData) => {
      return updateProjectAction({ projectId, data });
    },
    [projectId],
  );

  return (
    <ProjectForm
      title="Chỉnh sửa dự án"
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
    />
  );
}

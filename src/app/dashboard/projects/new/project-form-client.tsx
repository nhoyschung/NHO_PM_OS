'use client';

import { useCallback } from 'react';
import { ProjectForm } from '@/modules/projects/components/project-form';
import { createProjectAction } from '@/modules/projects/actions';
import type { ProjectFormData } from '@/modules/projects/types';

export function ProjectFormClient() {
  const handleSubmit = useCallback(async (data: ProjectFormData) => {
    return createProjectAction(data);
  }, []);

  return <ProjectForm title="Tạo dự án mới" onSubmit={handleSubmit} />;
}

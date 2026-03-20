import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/modules/projects/queries';
import { ProjectEditClient } from './project-edit-client';
import type { ProjectFormData } from '@/modules/projects/types';

interface EditProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const defaultValues: Partial<ProjectFormData> = {
    name: project.name,
    description: project.description ?? undefined,
    category: project.category ?? undefined,
    priority: project.priority as ProjectFormData['priority'],
    province: project.province ?? undefined,
    district: project.district ?? undefined,
    departmentId: project.departmentId ?? undefined,
    teamLeadId: project.teamLeadId ?? undefined,
    startDate: project.startDate ?? undefined,
    endDate: project.endDate ?? undefined,
    budget: project.budget ?? undefined,
    currency: project.currency ?? 'VND',
    tags: (project.tags as string[]) ?? [],
  };

  return <ProjectEditClient projectId={project.id} defaultValues={defaultValues} />;
}

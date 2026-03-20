import { getProjects } from '@/modules/projects/queries';
import { ProjectList } from '@/modules/projects/components/project-list';
import type { ProjectFilters } from '@/modules/projects/types';

interface ProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;

  // Build partial filters — Zod schema in getProjects() validates enum values
  const filters: Partial<ProjectFilters> = {
    search: typeof params.search === 'string' ? params.search : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : 1,
    perPage: typeof params.perPage === 'string' ? parseInt(params.perPage, 10) : 20,
    isArchived: false,
  };

  // Safely pass enum-like params — getProjects().parse() strips invalid values
  if (typeof params.stage === 'string') {
    (filters as Record<string, unknown>).stage = params.stage;
  }
  if (typeof params.priority === 'string') {
    (filters as Record<string, unknown>).priority = params.priority;
  }
  if (typeof params.healthStatus === 'string') {
    (filters as Record<string, unknown>).healthStatus = params.healthStatus;
  }

  const result = await getProjects(filters);

  return (
    <ProjectList
      data={result.data}
      total={result.total}
      page={result.page}
      perPage={result.perPage}
      totalPages={result.totalPages}
      filters={{
        search: typeof params.search === 'string' ? params.search : undefined,
        stage: typeof params.stage === 'string' ? params.stage : undefined,
        priority: typeof params.priority === 'string' ? params.priority : undefined,
        healthStatus: typeof params.healthStatus === 'string' ? params.healthStatus : undefined,
      }}
    />
  );
}

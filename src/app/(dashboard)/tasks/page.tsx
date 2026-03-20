import { getTasks } from '@/modules/tasks/queries';
import { TaskList } from '@/modules/tasks/components/task-list';
import type { TaskFilters } from '@/modules/tasks/types';

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;

  // Build partial filters — Zod schema in getTasks() validates enum values
  const filters: Partial<TaskFilters> = {
    search: typeof params.search === 'string' ? params.search : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : 1,
    perPage: typeof params.perPage === 'string' ? parseInt(params.perPage, 10) : 20,
  };

  // Safely pass enum-like params — parse() in getTasks() strips invalid values
  if (typeof params.status === 'string') {
    (filters as Record<string, unknown>).status = params.status;
  }
  if (typeof params.priority === 'string') {
    (filters as Record<string, unknown>).priority = params.priority;
  }
  if (typeof params.type === 'string') {
    (filters as Record<string, unknown>).type = params.type;
  }
  if (typeof params.projectId === 'string') {
    (filters as Record<string, unknown>).projectId = params.projectId;
  }
  if (typeof params.assigneeId === 'string') {
    (filters as Record<string, unknown>).assigneeId = params.assigneeId;
  }

  const result = await getTasks(filters);

  return (
    <TaskList
      data={result.data}
      total={result.total}
      page={result.page}
      perPage={result.perPage}
      totalPages={result.totalPages}
      filters={{
        search: typeof params.search === 'string' ? params.search : undefined,
        status: typeof params.status === 'string' ? params.status : undefined,
        priority: typeof params.priority === 'string' ? params.priority : undefined,
        type: typeof params.type === 'string' ? params.type : undefined,
      }}
    />
  );
}

import { getDocuments } from '@/modules/documents/queries';
import { DocumentList } from '@/modules/documents/components/document-list';
import type { DocumentFilters } from '@/modules/documents/types';

interface DocumentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = await searchParams;

  // Build partial filters — Zod schema in getDocuments() validates enum values
  const filters: Partial<DocumentFilters> = {
    search: typeof params.search === 'string' ? params.search : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : 1,
    perPage: typeof params.perPage === 'string' ? parseInt(params.perPage, 10) : 20,
  };

  // Safely pass enum-like params — getDocuments().parse() strips invalid values
  if (typeof params.type === 'string') {
    (filters as Record<string, unknown>).type = params.type;
  }
  if (typeof params.status === 'string') {
    (filters as Record<string, unknown>).status = params.status;
  }
  if (typeof params.projectId === 'string') {
    filters.projectId = params.projectId;
  }

  const result = await getDocuments(filters);

  return (
    <DocumentList
      data={result.data}
      total={result.total}
      page={result.page}
      perPage={result.perPage}
      totalPages={result.totalPages}
      filters={{
        search: typeof params.search === 'string' ? params.search : undefined,
        type: typeof params.type === 'string' ? params.type : undefined,
        status: typeof params.status === 'string' ? params.status : undefined,
        projectId: typeof params.projectId === 'string' ? params.projectId : undefined,
      }}
    />
  );
}

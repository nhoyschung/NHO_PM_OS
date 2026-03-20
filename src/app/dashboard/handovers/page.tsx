import { getHandovers } from '@/modules/handovers/queries';
import { HandoverList } from '@/modules/handovers/components/handover-list';
import type { HandoverFilters } from '@/modules/handovers/types';

interface HandoversPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HandoversPage({ searchParams }: HandoversPageProps) {
  const params = await searchParams;

  // Build partial filters — Zod schema in getHandovers() validates enum values
  const filters: Partial<HandoverFilters> = {
    search: typeof params.search === 'string' ? params.search : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : 1,
    perPage: typeof params.perPage === 'string' ? parseInt(params.perPage, 10) : 20,
  };

  // Safely pass enum-like params — getHandovers().parse() strips invalid values
  if (typeof params.status === 'string') {
    (filters as Record<string, unknown>).status = params.status;
  }
  if (typeof params.type === 'string') {
    (filters as Record<string, unknown>).type = params.type;
  }

  const result = await getHandovers(filters);

  return (
    <HandoverList
      data={result.data}
      total={result.total}
      page={result.page}
      perPage={result.perPage}
      totalPages={result.totalPages}
      filters={{
        search: typeof params.search === 'string' ? params.search : undefined,
        status: typeof params.status === 'string' ? params.status : undefined,
        type: typeof params.type === 'string' ? params.type : undefined,
      }}
    />
  );
}

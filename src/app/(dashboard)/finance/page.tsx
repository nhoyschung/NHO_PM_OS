import { getFinanceRecords, getFinanceSummary, getFinanceSummaryByProject } from '@/modules/finance/queries';
import { FinanceList } from '@/modules/finance/components/finance-list';
import { FinanceSummaryCards } from '@/modules/finance/components/finance-summary-cards';
import { FinanceDashboard } from '@/modules/finance/components/finance-dashboard';
import { FinanceViewToggle } from '@/modules/finance/components/finance-view-toggle';
import type { FinanceFilters } from '@/modules/finance/types';
import type { FinanceView } from '@/modules/finance/components/finance-view-toggle';

interface FinancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = await searchParams;

  const activeView: FinanceView = params.view === 'overview' ? 'overview' : 'list';

  const filters: Partial<FinanceFilters> = {
    search: typeof params.search === 'string' ? params.search : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : 1,
    perPage: typeof params.perPage === 'string' ? parseInt(params.perPage, 10) : 20,
  };

  // Safely pass enum-like params — getFinanceRecords().parse() strips invalid values
  if (typeof params.type === 'string') {
    (filters as Record<string, unknown>).type = params.type;
  }
  if (typeof params.status === 'string') {
    (filters as Record<string, unknown>).status = params.status;
  }
  if (typeof params.category === 'string') {
    (filters as Record<string, unknown>).category = params.category;
  }
  if (typeof params.projectId === 'string') {
    (filters as Record<string, unknown>).projectId = params.projectId;
  }

  // Fetch data based on active view
  const [result, summary, projectSummaries] = await Promise.all([
    activeView === 'list' ? getFinanceRecords(filters) : Promise.resolve(null),
    getFinanceSummary(),
    activeView === 'overview' ? getFinanceSummaryByProject() : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <FinanceViewToggle activeView={activeView} />
      </div>

      <FinanceSummaryCards summary={summary} />

      {activeView === 'list' && result && (
        <FinanceList
          data={result.data}
          total={result.total}
          page={result.page}
          perPage={result.perPage}
          totalPages={result.totalPages}
          filters={{
            search: typeof params.search === 'string' ? params.search : undefined,
            type: typeof params.type === 'string' ? params.type : undefined,
            status: typeof params.status === 'string' ? params.status : undefined,
          }}
        />
      )}

      {activeView === 'overview' && projectSummaries && (
        <FinanceDashboard summaries={projectSummaries} />
      )}
    </div>
  );
}

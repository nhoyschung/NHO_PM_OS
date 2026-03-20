import { getAuditLogs } from '@/modules/audit-logs/queries';
import { AuditLogList } from '@/modules/audit-logs/components/audit-log-list';
import type { AuditLogFilters } from '@/modules/audit-logs/types';

interface AuditLogsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const params = await searchParams;

  // Build partial filters — Zod schema in getAuditLogs() validates enum values
  const filters: Partial<AuditLogFilters> = {
    search: typeof params.search === 'string' ? params.search : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : 1,
    perPage: typeof params.perPage === 'string' ? parseInt(params.perPage, 10) : 20,
  };

  // Safely pass enum-like params — getAuditLogs().parse() strips invalid values
  if (typeof params.action === 'string') {
    (filters as Record<string, unknown>).action = params.action;
  }
  if (typeof params.entityType === 'string') {
    (filters as Record<string, unknown>).entityType = params.entityType;
  }
  if (typeof params.severity === 'string') {
    (filters as Record<string, unknown>).severity = params.severity;
  }
  if (typeof params.userId === 'string') {
    (filters as Record<string, unknown>).userId = params.userId;
  }
  if (typeof params.projectId === 'string') {
    (filters as Record<string, unknown>).projectId = params.projectId;
  }
  if (typeof params.dateFrom === 'string') {
    (filters as Record<string, unknown>).dateFrom = params.dateFrom;
  }
  if (typeof params.dateTo === 'string') {
    (filters as Record<string, unknown>).dateTo = params.dateTo;
  }

  const result = await getAuditLogs(filters);

  return (
    <AuditLogList
      data={result.data}
      total={result.total}
      page={result.page}
      perPage={result.perPage}
      totalPages={result.totalPages}
      filters={{
        search: typeof params.search === 'string' ? params.search : undefined,
        action: typeof params.action === 'string' ? params.action : undefined,
        entityType: typeof params.entityType === 'string' ? params.entityType : undefined,
        severity: typeof params.severity === 'string' ? params.severity : undefined,
      }}
    />
  );
}

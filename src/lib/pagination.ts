/** Paginated result shape. */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Apply offset/limit pagination to an array.
 * For DB-level pagination, use the overload that accepts pre-sliced data + total.
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * pageSize;

  return {
    data: items.slice(offset, offset + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

/**
 * Build a PaginatedResult from pre-sliced data (e.g., from a DB query
 * that already applied LIMIT/OFFSET) and a total count.
 */
export function paginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

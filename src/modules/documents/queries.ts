import { eq, and, or, ilike, gte, lte, desc, asc, count, sql, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { documents, documentVersions, users, projects } from '@/db/schema';
import type {
  DocumentListItem,
  DocumentDetail,
  DocumentFilters,
  DocumentVersion,
  PaginatedResult,
} from './types';
import { DocumentFilterSchema } from './types';

/** Escape LIKE wildcard metacharacters to prevent pattern injection. */
function escapeLikePattern(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}

// ── Column sort map ─────────────────────────────────────────────
// Maps sortBy filter values to actual Drizzle column references

const SORT_COLUMN_MAP = {
  title: documents.title,
  created_at: documents.createdAt,
  updated_at: documents.updatedAt,
  type: documents.type,
  status: documents.status,
  current_version: documents.currentVersion,
} as const;

// ── getDocuments ─────────────────────────────────────────────────
// Paginated document list with filtering, search, and sorting.

export async function getDocuments(
  rawFilters: Partial<DocumentFilters>,
): Promise<PaginatedResult<DocumentListItem>> {
  const filters = DocumentFilterSchema.parse(rawFilters);

  // Build dynamic where conditions
  const conditions = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(documents.title, `%${escapeLikePattern(filters.search)}%`),
        ilike(documents.description, `%${escapeLikePattern(filters.search)}%`),
      ),
    );
  }
  if (filters.type) {
    conditions.push(eq(documents.type, filters.type));
  }
  if (filters.status) {
    conditions.push(eq(documents.status, filters.status));
  }
  if (filters.projectId) {
    conditions.push(eq(documents.projectId, filters.projectId));
  }
  if (filters.handoverId) {
    conditions.push(eq(documents.handoverId, filters.handoverId));
  }
  if (filters.createdBy) {
    conditions.push(eq(documents.createdBy, filters.createdBy));
  }
  if (filters.dateFrom) {
    conditions.push(gte(documents.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(documents.createdAt, new Date(filters.dateTo)));
  }

  // Only non-deleted documents
  conditions.push(sql`${documents.deletedAt} IS NULL`);

  const where = and(...conditions);

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy];
  const orderBy = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute data + count queries in parallel
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        type: documents.type,
        status: documents.status,
        currentVersion: documents.currentVersion,
        filePath: documents.filePath,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        projectId: documents.projectId,
        handoverId: documents.handoverId,
        createdBy: documents.createdBy,
        tags: documents.tags,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        createdByName: users.fullName,
        projectName: projects.name,
      })
      .from(documents)
      .leftJoin(users, eq(documents.createdBy, users.id))
      .leftJoin(projects, eq(documents.projectId, projects.id))
      .where(where)
      .orderBy(orderBy)
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(documents).where(where),
  ]);

  const total = countResult[0]?.value ?? 0;

  const data: DocumentListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as DocumentListItem['type'],
    status: row.status as DocumentListItem['status'],
    currentVersion: row.currentVersion,
    filePath: row.filePath,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    projectId: row.projectId,
    handoverId: row.handoverId,
    createdBy: row.createdBy,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdByName: row.createdByName,
    projectName: row.projectName,
  }));

  return {
    data,
    total,
    page: filters.page,
    perPage: filters.perPage,
    totalPages: Math.ceil(total / filters.perPage),
  };
}

// ── getDocumentById ──────────────────────────────────────────────
// Single document with full relations + version history.

export async function getDocumentById(id: string): Promise<DocumentDetail | null> {
  const result = await db.query.documents.findFirst({
    where: and(eq(documents.id, id), sql`${documents.deletedAt} IS NULL`),
    with: {
      createdByUser: {
        columns: { id: true, fullName: true, email: true },
      },
      project: {
        columns: { id: true, name: true, code: true, slug: true },
      },
      handover: {
        columns: { id: true, title: true },
      },
      versions: {
        orderBy: (v, { desc: descFn }) => [descFn(v.versionNumber)],
      },
    },
  });

  if (!result) return null;

  // Compute version count in parallel
  const [versionCountResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, id)),
  ]);

  // Enrich versions with creator names
  const versionIds = result.versions.map((v) => v.createdBy);
  let versionCreatorNames: Record<string, string | null> = {};

  if (versionIds.length > 0) {
    const versionCreators = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, versionIds));

    versionCreatorNames = Object.fromEntries(
      versionCreators.map((u) => [u.id, u.fullName]),
    );
  }

  const versions: DocumentVersion[] = result.versions.map((v) => ({
    id: v.id,
    documentId: v.documentId,
    versionNumber: v.versionNumber,
    changeSummary: v.changeSummary,
    content: v.content,
    filePath: v.filePath,
    fileSize: v.fileSize,
    createdBy: v.createdBy,
    createdAt: v.createdAt,
    createdByName: versionCreatorNames[v.createdBy] ?? null,
  }));

  return {
    ...result,
    versions,
    _count: {
      versions: versionCountResult[0]?.value ?? 0,
    },
  } as DocumentDetail;
}

// ── getDocumentsByProject ─────────────────────────────────────────
// All documents belonging to a specific project (non-deleted).

export async function getDocumentsByProject(
  projectId: string,
): Promise<PaginatedResult<DocumentListItem>> {
  return getDocuments({ projectId });
}

// ── getDocumentVersions ───────────────────────────────────────────
// All versions for a specific document, ordered newest first.

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const rows = await db
    .select({
      id: documentVersions.id,
      documentId: documentVersions.documentId,
      versionNumber: documentVersions.versionNumber,
      changeSummary: documentVersions.changeSummary,
      content: documentVersions.content,
      filePath: documentVersions.filePath,
      fileSize: documentVersions.fileSize,
      createdBy: documentVersions.createdBy,
      createdAt: documentVersions.createdAt,
      createdByName: users.fullName,
    })
    .from(documentVersions)
    .leftJoin(users, eq(documentVersions.createdBy, users.id))
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.versionNumber));

  return rows.map((row) => ({
    id: row.id,
    documentId: row.documentId,
    versionNumber: row.versionNumber,
    changeSummary: row.changeSummary,
    content: row.content,
    filePath: row.filePath,
    fileSize: row.fileSize,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    createdByName: row.createdByName,
  }));
}

// ── getDocumentStats ─────────────────────────────────────────────
// Aggregate counts for dashboard statistics.

export interface DocumentStats {
  total: number;
  countByType: Record<string, number>;
  countByStatus: Record<string, number>;
}

export async function getDocumentStats(): Promise<DocumentStats> {
  const [totalResult, typeRows, statusRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(documents)
      .where(sql`${documents.deletedAt} IS NULL`),
    db
      .select({ type: documents.type, count: count() })
      .from(documents)
      .where(sql`${documents.deletedAt} IS NULL`)
      .groupBy(documents.type),
    db
      .select({ status: documents.status, count: count() })
      .from(documents)
      .where(sql`${documents.deletedAt} IS NULL`)
      .groupBy(documents.status),
  ]);

  const countByType: Record<string, number> = {};
  for (const row of typeRows) {
    if (row.type) countByType[row.type] = row.count;
  }

  const countByStatus: Record<string, number> = {};
  for (const row of statusRows) {
    if (row.status) countByStatus[row.status] = row.count;
  }

  return {
    total: totalResult[0]?.value ?? 0,
    countByType,
    countByStatus,
  };
}


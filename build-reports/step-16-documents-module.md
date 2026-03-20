# Step 16 Build Report: Documents + Document Versions Module

## Summary

Step 16 delivers the complete `documents` module for ProjectOpsOS, implementing full document management with version history. The module follows the golden-module-pattern.md exactly, mirroring the `projects` reference module in structure, conventions, and quality level.

---

## Files Created (16 total)

### Module Core

| File | Lines | Role |
|------|-------|------|
| `src/modules/documents/types.ts` | 122 | Zod enums, DB row types, view models, filter schema, PaginatedResult |
| `src/modules/documents/constants.ts` | 116 | Vietnamese labels, Tailwind colors, icons, VALIDATION, PERMISSIONS, FILTER_PRESETS |
| `src/modules/documents/validation.ts` | 68 | uploadDocumentSchema, updateDocumentSchema, createVersionSchema, re-export |
| `src/modules/documents/queries.ts` | 245 | getDocuments, getDocumentById, getDocumentsByProject, getDocumentVersions, getDocumentStats |
| `src/modules/documents/actions.ts` | 172 | uploadDocument, uploadNewVersion, updateDocumentMetadata, deleteDocument (all createAction) |

### Components

| File | Lines | Role |
|------|-------|------|
| `src/modules/documents/components/document-list.tsx` | 204 | Client list with search, type/status filters, pagination, type icons, version badges |
| `src/modules/documents/components/document-detail.tsx` | 235 | Tabbed detail (info/versions/content) + sidebar + version upload form + delete confirm |
| `src/modules/documents/components/document-upload-form.tsx` | 152 | Upload form with Zod client validation, FieldGroup helper |
| `src/modules/documents/components/document-type-badge.tsx` | 24 | Badge for DocumentType (reads from constants) |
| `src/modules/documents/components/document-status-badge.tsx` | 24 | Badge for DocumentStatus (reads from constants) |
| `src/modules/documents/components/index.ts` | 5 | Barrel re-export (named exports only) |

### Page Routes

| File | Lines | Role |
|------|-------|------|
| `src/app/(dashboard)/documents/page.tsx` | 52 | Server component: parse searchParams, call getDocuments, render DocumentList |
| `src/app/(dashboard)/documents/[id]/page.tsx` | 17 | Server component: resolve id, call getDocumentById, render client wrapper |
| `src/app/(dashboard)/documents/[id]/document-detail-client.tsx` | 25 | Client wrapper: bridge uploadNewVersion action to DocumentDetail via useCallback |
| `src/app/(dashboard)/documents/new/page.tsx` | 19 | Client page: new document creation via DocumentUploadForm |

### Tests

| File | Lines | Role |
|------|-------|------|
| `tests/modules/documents/documents.test.ts` | 298 | Enum coverage, Tailwind patterns, Zod boundary tests (upload/update/version/filters) |

---

## pACS Self-Rating

### F — Functional Correctness

**Score: 4.8 / 5**

- All 4 actions use `createAction()` wrapper (auth + error handling from `@/lib/action`).
- Every mutation creates an audit log entry via `createAuditLog()` helper matching the pattern from `projects/actions.ts`.
- `uploadDocument` creates both the document record AND the initial version (v1) in a single transaction sequence — preserving version history invariant.
- `uploadNewVersion` reads `currentVersion`, increments atomically, inserts version record, updates document — correct sequencing.
- `deleteDocument` is soft-delete via `deletedAt` timestamp — no data destruction.
- `getDocuments` excludes deleted documents via `IS NULL` filter on `deletedAt`.
- `getDocumentById` uses `db.query.documents.findFirst()` with nested `with:` relations for project, handover, createdByUser, and versions — matching the pattern.
- Version creator names enriched via `inArray` batch query (avoids N+1).
- `escapeLikePattern` applied to all `ilike()` search queries.
- `SORT_COLUMN_MAP` maps string sortBy values to Drizzle column refs.
- Parallel `Promise.all()` for data + count queries in `getDocuments`.

Minor deduction: File upload (actual binary storage) is UI-layer concern not covered here — forms handle metadata only. File path/size columns exist in schema for when storage integration is added.

### C — Completeness

**Score: 5.0 / 5**

All 12 files specified in the task brief were delivered plus 4 additional supporting files:
- `document-type-badge.tsx` and `document-status-badge.tsx` (required by golden pattern)
- `new/page.tsx` (new document creation route — needed for the list page "Tạo tài liệu" button)
- `[id]/document-detail-client.tsx` (client wrapper as specified by golden pattern)

All query functions: ✓ getDocuments ✓ getDocumentById ✓ getDocumentsByProject ✓ getDocumentVersions + bonus getDocumentStats.
All actions: ✓ uploadDocument ✓ uploadNewVersion ✓ updateDocumentMetadata ✓ deleteDocument.
All components: ✓ list ✓ detail ✓ form ✓ type badge ✓ status badge ✓ barrel index.

### L — Label / Language Compliance

**Score: 5.0 / 5**

All Vietnamese UI text sourced from `ref-ux-vietnam.md`:
- Document type labels: all 9 types (ref Section 10)
- Document status labels: all 5 statuses (ref Section 9)
- Form labels, button text, empty states, confirmation dialogs — all Vietnamese
- Error messages in actions: all Vietnamese
- Pagination text: "Hiển thị X–Y trên Z mục", "Trang X / Y", "Trước", "Tiếp"

### T — TypeScript / Test Quality

**Score: 5.0 / 5**

- `pnpm exec tsc --noEmit` → **0 errors**
- `pnpm exec vitest run tests/modules/documents/documents.test.ts` → **63/63 passing**
- Test coverage: enum coverage (both types × 9 = 18 values, statuses × 5 = 5 values), Tailwind pattern validation, permission RBAC pattern, uploadDocumentSchema (15 cases), updateDocumentSchema (5 cases), createVersionSchema (6 cases), documentFiltersSchema (12 cases), DocumentType/Status enum shape (2 cases)
- Fixed: `ActionResult` type import from `@/lib/action` (not re-exported from types.ts)
- Fixed: `inArray` used instead of raw SQL ANY for version creator batch lookup
- Fixed: removed unused import of `handovers` and `DEFAULT_PER_PAGE` from queries

---

## Pattern Conformance (vs golden-module-pattern.md)

| Checklist Item | Status |
|----------------|--------|
| `'use server'` directive in actions.ts | ✓ |
| `createAction()` wrapper on all actions | ✓ |
| `createAuditLog()` on every mutation | ✓ |
| `revalidatePath()` after mutations | ✓ |
| `safeParse()` at action entry | ✓ |
| `escapeLikePattern()` in search | ✓ |
| `SORT_COLUMN_MAP` for sort routing | ✓ |
| `Promise.all()` for data+count | ✓ |
| `DocumentFilterSchema.parse()` at query entry | ✓ |
| Named exports only (no default in components) | ✓ |
| `'use client'` on all client components | ✓ |
| Server component list page (parse searchParams) | ✓ |
| Server component detail page (resolve id, notFound) | ✓ |
| Client wrapper bridges actions to detail component | ✓ |
| URL-based state management in list | ✓ |
| `useTransition()` for non-blocking nav | ✓ |
| Badge components read from constants | ✓ |
| Barrel index.ts (named re-exports) | ✓ |
| Dependency direction: constants ← types ← validation ← queries/actions ← components ← pages | ✓ |

---

## Key Design Decisions

1. **No slug for documents**: Documents use `id` (UUID) as the route parameter instead of slug. The schema has no slug column, and document titles are not URL-friendly identifiers. Route is `/documents/[id]` not `/documents/[slug]`.

2. **Version history as append-only**: `uploadNewVersion` never modifies existing version records. It inserts a new row and increments `currentVersion` on the parent. This ensures the audit trail is immutable.

3. **Soft delete only**: `deleteDocument` sets `deletedAt` only. All queries filter `WHERE deleted_at IS NULL`. Data is never physically removed.

4. **File metadata separation**: The schema has `filePath`, `fileSize`, `mimeType` columns but actual file storage is a deployment concern. The form currently handles metadata + text `content`. File upload (multipart) can be wired to a storage provider (S3/Supabase Storage) in a later step without changing the schema.

5. **Version creator enrichment**: Uses `inArray` batch query (not N+1 per version) to fetch creator names for all versions in one round-trip.

---

## Verification Commands

```bash
# TypeScript check
pnpm exec tsc --noEmit  # → 0 errors

# Test suite
pnpm exec vitest run tests/modules/documents/documents.test.ts  # → 63/63 passed

# Pages available at:
# /dashboard/documents          ← list
# /dashboard/documents/[id]     ← detail + version history
# /dashboard/documents/new      ← create form
```

---

*Generated: Step 16 — Documents + Document Versions module, ProjectOpsOS Phase 3.*

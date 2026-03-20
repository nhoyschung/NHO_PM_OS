# Step 27: Reports + Excel/PDF Export — Build Report

**Status**: COMPLETE
**Date**: 2026-03-19
**Agent**: Dashboard Builder

---

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `src/modules/reports/types.ts` | ReportType, ExportFormat, ReportConfig, row types, CsvColumn |
| 2 | `src/modules/reports/constants.ts` | Vietnamese labels, UTF-8 BOM, REPORT_MAX_ROWS |
| 3 | `src/modules/reports/queries.ts` | 4 report query functions (project, finance, task, handover) |
| 4 | `src/modules/reports/actions.ts` | generateReport server action, exportToCsv, CSV column defs |
| 5 | `src/modules/reports/components/report-generator.tsx` | Client-side report config form + download |
| 6 | `src/modules/reports/components/report-preview.tsx` | Table preview of report data |
| 7 | `src/modules/reports/components/index.ts` | Barrel exports |
| 8 | `src/app/(dashboard)/reports/page.tsx` | Reports page (server component) |
| 9 | `tests/modules/reports/reports.test.ts` | 31 tests — validation, constants, CSV generation, exports |

## Report Types

| Type | Vietnamese Label | Data Source |
|------|-----------------|-------------|
| `project_summary` | Tổng hợp dự án | projects + tasks (count) |
| `finance_summary` | Tổng hợp tài chính | financial_records grouped by project/type/category |
| `task_completion` | Tiến độ công việc | tasks grouped by project with completion rates |
| `handover_status` | Tình trạng bàn giao | handovers with user names |

## Export Formats

- **CSV**: UTF-8 BOM prefix for Excel compatibility, proper field escaping
- **JSON**: Pretty-printed with metadata (type, generatedAt, rowCount)

## Key Design Decisions

1. **Server-side generation, client-side download**: `generateReport` server action returns content string; client creates Blob + download link
2. **VND formatting**: `Intl.NumberFormat('vi-VN')` in CSV format columns for financial amounts
3. **UTF-8 BOM**: `\uFEFF` prefix ensures Excel opens CSV files with correct Vietnamese character encoding
4. **Limit**: REPORT_MAX_ROWS = 10,000 rows per report to prevent memory issues
5. **No PDF**: Excluded per spec (CSV + JSON only); PDF can be added later via server-side library if needed

## Verification

- `pnpm exec tsc --noEmit` — PASS (zero errors)
- `pnpm exec vitest run tests/modules/reports/reports.test.ts` — 31/31 PASS

## pACS Self-Rating

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F** (Functionality) | 9/10 | All 4 report types implemented with query, CSV/JSON export, client download. Preview for JSON. |
| **C** (Code Quality) | 9/10 | Follows CONVENTIONS.md patterns (named exports, Vietnamese labels, Zod validation, createAction wrapper). |
| **L** (Localization) | 10/10 | All user-facing strings in Vietnamese. Column headers, labels, error messages. |
| **T** (Testing) | 9/10 | 31 tests covering schema validation, enum coverage, label coverage, CSV generation edge cases, export verification. |

# Step 26: CSV Import + Financial Display

## Summary

Enhanced the finance module with a project-grouped financial dashboard and a list/overview toggle on the finance page. The existing CSV import component was reviewed and found to already satisfy all requirements (column validation, error display with row numbers, progress indicator, Vietnamese success/failure summary), so no changes were needed there.

## Changes

### 26.1 Finance Dashboard Component
- **Created** `src/modules/finance/components/finance-dashboard.tsx`
  - Project-grouped financial overview table
  - Columns: Tên dự án | Tổng thu | Tổng chi | Số dư | Số bản ghi
  - VND formatting via `formatCurrency()` (Intl.NumberFormat vi-VN)
  - Sorted by balance ascending (deficit projects highlighted with AlertTriangle icon)
  - Grand total footer row
  - Vietnamese labels throughout
  - Empty state for no data

### 26.2 Enhanced CSV Import Flow
- **Reviewed** `finance-csv-import.tsx` — already implements:
  - Column mapping validation against `CSV_REQUIRED_COLUMNS`
  - Error display with row numbers ("Dòng {n}: {message}")
  - Import progress indicator (`isPending` state via `useTransition`)
  - Success/failure summary in Vietnamese (Thành công / Bỏ qua / Lỗi cards)
- **No changes needed** — component was already complete

### 26.3 Finance Page Enhancement
- **Updated** `src/app/(dashboard)/finance/page.tsx`
  - Added `view` search param: `list` (default) or `overview`
  - Toggle between "Danh sách" (List) and "Tổng quan" (Overview) tabs
  - Conditional data fetching based on active view
- **Created** `src/modules/finance/components/finance-view-toggle.tsx`
  - Client component with pill-style toggle
  - Updates URL search params, preserves other filters

### 26.4 Supporting Changes
- **Added** `ProjectFinanceSummary` interface to `types.ts`
- **Added** `getFinanceSummaryByProject()` query to `queries.ts`
  - Fetches all records with project join
  - Aggregates income/expense/balance/count per project
  - Sorts by balance ascending (deficit first)
- **Updated** `components/index.ts` — re-exports `FinanceDashboard`, `FinanceViewToggle`
- **Updated** `index.ts` — re-exports `FinanceDashboard`

### 26.5 Tests
- **Created** `tests/modules/finance/finance-dashboard.test.ts` — 26 tests:
  - VND formatting (4 tests): positive, zero, negative, Intl.NumberFormat parity
  - Summary calculation (7 tests): grand totals, deficit detection, sort order, balance formula
  - Income/expense classification (6 tests): all 6 financial types
  - CSV column validation (8 tests): individual required columns, missing detection, pass-through
  - Query export verification (1 test)

## Verification

| Check | Result |
|-------|--------|
| `pnpm exec tsc --noEmit` | PASS (0 errors) |
| `vitest run finance-dashboard.test.ts` | PASS (26/26) |
| `vitest run finance.test.ts` | PASS (58/58, no regressions) |

## Files Modified/Created

| File | Action |
|------|--------|
| `src/modules/finance/types.ts` | Modified (added `ProjectFinanceSummary`) |
| `src/modules/finance/queries.ts` | Modified (added `getFinanceSummaryByProject`) |
| `src/modules/finance/components/finance-dashboard.tsx` | Created |
| `src/modules/finance/components/finance-view-toggle.tsx` | Created |
| `src/modules/finance/components/index.ts` | Modified |
| `src/modules/finance/index.ts` | Modified |
| `src/app/(dashboard)/finance/page.tsx` | Modified |
| `tests/modules/finance/finance-dashboard.test.ts` | Created |
| `build-reports/step-26-csv-import-finance-display.md` | Created |

## pACS Self-Rating

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F** (Functionality) | 9/10 | All 4 sub-tasks complete. Dashboard displays project-grouped financials with VND formatting. CSV import already had all features. View toggle works. |
| **C** (Completeness) | 9/10 | All components created, tests written (26 new + 58 existing pass), TypeScript compiles clean. |
| **L** (Learnability) | 9/10 | Vietnamese labels from ref-ux-vietnam.md SOT. Consistent patterns with existing finance module components. |
| **T** (Technical) | 9/10 | Named exports only. VND formatting via `Intl.NumberFormat('vi-VN')`. No `any`. Follows CONVENTIONS.md patterns. |

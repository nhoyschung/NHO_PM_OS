# Step 6: App Shell — Sidebar + Layout

## Summary

Created the application shell with Vietnamese sidebar navigation, header with user dropdown, responsive dashboard layout, auth-guarded route group layout, and a placeholder dashboard page.

## Files Created

| File | Purpose |
|------|---------|
| `src/components/layout/sidebar.tsx` | Vietnamese sidebar with 10 nav items, role-based visibility, mobile collapse |
| `src/components/layout/header.tsx` | App header with notification bell (badge), user avatar + dropdown (profile, role, logout) |
| `src/components/layout/dashboard-layout.tsx` | Combines sidebar + header + main content, manages mobile sidebar state |
| `src/app/(dashboard)/layout.tsx` | Server component auth guard — redirects to `/login` if unauthenticated |
| `src/app/(dashboard)/page.tsx` | Placeholder dashboard with 4 summary cards and welcome message |

## Files Modified

| File | Change |
|------|--------|
| `src/app/layout.tsx` | `lang="vi"`, `latin-ext` subset for Vietnamese diacritics, metadata updated to ProjectOpsOS |

## Design Decisions

1. **Sidebar nav items match ref-ux-screens.md SOT exactly**: 5 main items + 4 management items (admin/manager only) + settings, with correct icons and routes.
2. **Vietnamese labels from ref-ux-vietnam.md**: `Tổng quan`, `Dự án`, `Công việc của tôi`, `Bàn giao`, `Tài liệu`, `Báo cáo`, `Tài chính`, `Tuân thủ`, `Nhật ký kiểm toán`, `Cài đặt`.
3. **Role-based visibility**: Management section (Reports, Financials, Compliance, Audit Log) only visible to `admin` and `manager` roles, matching the access rules in ref-ux-screens.md.
4. **Responsive breakpoints**: Sidebar hidden on mobile (< lg), toggled via hamburger menu. Overlay backdrop on mobile. Static on desktop.
5. **Auth guard**: `(dashboard)/layout.tsx` is a server component that calls `getCurrentUser()` from `auth-utils.ts` and redirects to `/login` if null.
6. **`latin-ext` instead of `vietnamese`**: Geist font does not have a dedicated `vietnamese` subset; `latin-ext` covers Vietnamese diacritics (U+0100-024F).
7. **No shadcn/ui dependency**: Built with Tailwind utility classes since no shadcn/ui components are installed yet. Components can be upgraded to shadcn/ui primitives when those are added.
8. **Header dropdown**: Vietnamese labels — `Hồ sơ cá nhân` (Profile), role display with Vietnamese labels, `Đăng xuất` (Logout).
9. **Notification badge**: Hardcoded count `3` as placeholder — will be replaced by real data when notification feature is implemented.

## Verification

```
pnpm exec tsc --noEmit    → PASS (0 errors)
pnpm exec eslint .        → 0 errors, 1 pre-existing warning (unrelated db/schema/relations.ts)
```

## pACS Self-Assessment

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Completeness** | 5/5 | All 6 deliverables created (sidebar, header, dashboard-layout, dashboard group layout, dashboard page, root layout update) |
| **Accuracy** | 5/5 | Vietnamese labels match ref-ux-vietnam.md SOT exactly; routes match ref-ux-screens.md route map; role-based access matches spec |
| **Code Quality** | 5/5 | TypeScript strict mode passes; follows CONVENTIONS.md (named exports for non-page, default exports for pages, camelCase, kebab-case files); single-responsibility per component |
| **Integration** | 5/5 | Auth guard uses existing `getCurrentUser()` from auth-utils.ts; signOut uses next-auth/react; routes align with prior steps |
| **Spec Fidelity** | 4/5 | Minor deviation: task spec listed 10 menu items with slightly different naming (e.g. "Trang chu" vs SOT "Tong quan"); followed ref-ux-vietnam.md SOT as authoritative source |

**Overall: 4.8/5**

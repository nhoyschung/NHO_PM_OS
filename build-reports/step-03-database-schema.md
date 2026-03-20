# Step 3 — Database Schema: Build Report

> **Agent**: @schema-architect
> **Date**: 2026-03-19
> **Status**: COMPLETE

---

## Summary

Created 19 database tables using Drizzle ORM with 30 PostgreSQL enums, comprehensive indexes, and full relation definitions. All files pass `tsc --noEmit` with zero errors.

---

## Files Created

| File | Purpose | Tables |
|------|---------|--------|
| `src/db/schema/enums.ts` | All 30 PostgreSQL enums | — |
| `src/db/schema/foundation.ts` | Identity & access control | users, departments, roles, user_sessions, user_invitations |
| `src/db/schema/core.ts` | Business domain | projects, project_members, handovers, handover_checklist_items, documents, document_versions, project_stage_history |
| `src/db/schema/operations.ts` | Day-to-day operations | tasks, task_comments, notifications, audit_logs, financial_records, compliance_records, settings |
| `src/db/schema/relations.ts` | All Drizzle relation definitions | — |
| `src/db/schema/index.ts` | Barrel re-export | — |
| `src/db/index.ts` | Database connection (postgres-js + drizzle) | — |

---

## 19 Tables

### Foundation (5)
1. **users** — Extends Supabase Auth with profile, organization, billing, preferences
2. **departments** — Organization hierarchy with parent-child structure
3. **roles** — RBAC roles with JSON permissions and hierarchy levels
4. **user_sessions** — Session tracking for audit
5. **user_invitations** — Email invitation workflow with token-based verification

### Core (7)
6. **projects** — Central entity with 10-stage lifecycle, province/district, budget, manager_id, created_by_id
7. **project_members** — Junction table for project team membership
8. **handovers** — Formal project transfer records between users/departments
9. **handover_checklist_items** — Verification checklist items per handover
10. **documents** — Project/handover documentation with version tracking
11. **document_versions** — Content snapshots for document version history
12. **project_stage_history** — Immutable log of stage transitions (forward/backward)

### Operations (7)
13. **tasks** — Work items with hierarchy, assignment, effort tracking
14. **task_comments** — Threaded comments on tasks
15. **notifications** — Multi-type notification system with email delivery tracking
16. **audit_logs** — Immutable, append-only audit trail with snapshots
17. **financial_records** — Budget allocation, expenses, invoices per project
18. **compliance_records** — Framework-based compliance tracking (ISO 27001, SOC2, GDPR, etc.)
19. **settings** — System/organization/user-scoped key-value configuration

---

## 30 PostgreSQL Enums

| Category | Enums |
|----------|-------|
| Foundation | subscription_status, subscription_tier, device_type, invitation_status |
| Core | project_stage (10 Vietnamese stages), project_priority, health_status, project_member_role, handover_type, handover_status, checklist_category, checklist_priority, document_type, document_status, transition_direction |
| Operations | task_type, task_status, task_priority, notification_type, notification_priority, audit_action, audit_entity_type, audit_severity, financial_type, financial_category, financial_status, compliance_framework, compliance_status, risk_level, setting_scope |

---

## Project Stage Enum (10 Vietnamese Stages)

| # | Key | Vietnamese Label |
|---|-----|-----------------|
| 1 | `initiation` | Khởi tạo |
| 2 | `planning` | Lập kế hoạch |
| 3 | `in_progress` | Đang thực hiện |
| 4 | `review` | Đánh giá |
| 5 | `testing` | Kiểm thử |
| 6 | `staging` | Tiền triển khai |
| 7 | `deployment` | Triển khai |
| 8 | `monitoring` | Giám sát |
| 9 | `handover` | Bàn giao |
| 10 | `completed` | Hoàn thành |

---

## Projects Table Fields

Per requirements, the `projects` table includes all specified columns:
- `id`, `name`, `code`, `description`, `province`, `district`
- `stage` (10-value enum), `department_id`, `manager_id`, `team_lead_id`
- `start_date`, `end_date`, `budget`, `budget_spent`, `currency`
- `created_at`, `updated_at`, `created_by_id`
- Additional: `slug`, `category`, `priority`, `health_status`, `progress_percentage`, `tags`, `metadata`, `is_archived`, `actual_end_date`, `deleted_at`

---

## Design Decisions

1. **No inline foreign keys on foundation tables**: `users.department_id` and `users.role_id` do not use `.references()` to avoid circular dependency between `users` and `departments` (departments references users via `head_user_id`). Foreign key constraints will be added via migrations.

2. **`project_stage_history` (table 12)**: Added to provide an immutable audit trail of stage transitions, as required by the state machine (ref-state-machine.md §8). Tracks direction (forward/backward) and trigger.

3. **`settings` (table 19)**: Added to support system/organization/user-scoped configuration, referenced in the RBAC permissions matrix (`settings: { read, update }`).

4. **Currency default `VND`**: Changed from `USD` to `VND` to match the Vietnamese business context (ref-seed-data.md).

5. **`pgEnum` over inline text enums**: All status/type fields use `pgEnum` for type safety at the database level, as opposed to the ref's inline `text('field', { enum: [...] })` pattern.

6. **camelCase TypeScript properties**: Column definitions use camelCase (`managerId`) which Drizzle maps to snake_case SQL (`manager_id`), following CONVENTIONS.md §1.2.

---

## Verification

```
$ pnpm exec tsc --noEmit
(exit code 0 — zero errors)
```

---

## pACS Self-Assessment

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Accuracy** | 9/10 | All 19 tables match ref specifications. Projects table includes all required fields (province, district, manager_id, budget, created_by_id). 10 Vietnamese stages from ref-state-machine.md. Minor deviation: no inline `.references()` on circular FK pairs — handled via migration. |
| **Completeness** | 9/10 | 19/19 tables, 30 enums, full relations, indexes on all query-critical columns, barrel exports, db connection file. Vietnamese comments throughout. |
| **Structure** | 10/10 | Clean file separation (enums → foundation → core → operations → relations → index). Follows CONVENTIONS.md naming (snake_case tables, camelCase TS). Zero tsc errors. |

**Overall**: 9.3/10 — Fully functional schema layer ready for migration generation.

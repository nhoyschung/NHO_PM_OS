# Build Report: Step 01 — CONVENTIONS.md + Reference File Extraction

**Date**: 2026-03-19
**Agent**: @schema-architect
**Status**: COMPLETE

---

## Summary

Extracted project conventions and 15 reference files from the PRD (`prompt/prd.md`, 2,666 lines). These files serve as the Single Source of Truth (SOT) that all downstream agents will read during implementation.

---

## Files Created

### 1. CONVENTIONS.md

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| CONVENTIONS.md | `D:\WorkSpace\ProjectOpsOS\CONVENTIONS.md` | ~350 | Naming, TypeScript patterns, project structure, module pattern, code style |

**Covers**:
- File/directory naming (kebab-case), function/variable naming (camelCase), type naming (PascalCase)
- Database naming (snake_case, plural tables)
- TypeScript import order, export patterns, Zod-first type definitions
- Project structure for both CLI tool and generated SaaS
- Module structure pattern (types.ts, constants.ts, validation.ts, queries.ts, actions.ts)
- Code style (Biome, 2-space indent, English comments)
- Testing conventions (Vitest, AAA pattern, cassette pattern for LLM)
- Git conventions (conventional commits)

### 2. Reference Files (15 files in `refs/`)

| # | File | Path | Lines | Content |
|---|------|------|-------|---------|
| 1 | ref-tech-stack.md | `refs/ref-tech-stack.md` | ~280 | CLI stack, generated SaaS stack, rejected tech, 7 Day-1 interfaces, multi-LLM strategy |
| 2 | ref-project-structure.md | `refs/ref-project-structure.md` | ~250 | Full directory trees for CLI tool and generated SaaS, file count breakdown |
| 3 | ref-schema-foundation.md | `refs/ref-schema-foundation.md` | ~300 | users, departments, roles tables with Drizzle schemas, RLS policies, relations, Zod validation |
| 4 | ref-schema-core.md | `refs/ref-schema-core.md` | ~350 | projects, project_members, handovers, handover_checklist_items, documents, document_versions with full schemas, RLS, indexes |
| 5 | ref-schema-operations.md | `refs/ref-schema-operations.md` | ~380 | tasks, task_comments, notifications, audit_logs, financial_records, compliance_records with schemas, RLS, indexes |
| 6 | ref-state-machine.md | `refs/ref-state-machine.md` | ~300 | 10 stages, 15 allowed transitions (9 forward + 6 backward), transition matrix, Vietnamese labels, colors, validation function |
| 7 | ref-golden-module.md | `refs/ref-golden-module.md` | ~320 | Projects module as canonical pattern: types.ts, constants.ts, validation.ts, queries.ts, actions.ts, components/ |
| 8 | ref-features-f01-f04.md | `refs/ref-features-f01-f04.md` | ~340 | Projects (F01), Handovers (F02), Documents (F03), Auth/RBAC (F04) with requirements, UI screens, acceptance criteria |
| 9 | ref-features-f05-f10.md | `refs/ref-features-f05-f10.md` | ~350 | Tasks (F05), Notifications (F06), Audit (F07), Finance (F08), Reports (F09), Compliance (F10) with integration points |
| 10 | ref-ux-screens.md | `refs/ref-ux-screens.md` | ~280 | Route map (40+ routes), layout hierarchy, dashboard wireframe, component patterns (list/detail/form), responsive breakpoints |
| 11 | ref-ux-vietnam.md | `refs/ref-ux-vietnam.md` | ~400 | Complete Vietnamese label dictionary: 22 sections covering navigation, stages, priorities, statuses, notifications, audit actions, form labels, validation messages, page titles, empty states, confirmation dialogs |
| 12 | ref-seed-data.md | `refs/ref-seed-data.md` | ~280 | 7 departments, 5 roles with full permission objects, admin user, 4 sample users, 3 sample projects, 3 sample tasks, seed script structure |
| 13 | ref-rbac-matrix.md | `refs/ref-rbac-matrix.md` | ~250 | 5 roles x 10 modules permission matrix, condensed quick-reference, permission check implementation, RLS policy mapping |
| 14 | ref-integrations.md | `refs/ref-integrations.md` | ~300 | Module dependency graph, 20+ integration points, 6 event payloads with TypeScript interfaces, query-based integrations for reports, shared helper functions |
| 15 | ref-handover-templates.md | `refs/ref-handover-templates.md` | ~280 | 5 handover type templates (project_transfer: 20 items, stage_transition: 10, team_change: 8, department_transfer: 11, role_change: 6), bilingual items, template registry implementation |

---

## Key Design Decisions

1. **Schema files split into 3 ref files** (foundation, core, operations) for manageable scope per agent task
2. **Vietnamese labels centralized** in `ref-ux-vietnam.md` as single dictionary — components reference this, not inline strings
3. **Golden module pattern** uses `projects` module as canonical reference because it has the most complex business logic (state machine, team membership, multi-entity relationships)
4. **RBAC matrix** stored as explicit permission objects on each role (JSON), not as a junction table — simpler for V1 with 5 fixed roles
5. **Handover templates** are bilingual (EN + VI) with Vietnamese as default display language
6. **All Drizzle schemas** include RLS policies and indexes as part of the reference — not separate concerns

---

## Completeness Check

| Required by Task | Delivered? | File |
|-----------------|-----------|------|
| CONVENTIONS.md | Yes | `CONVENTIONS.md` |
| ref-tech-stack.md | Yes | `refs/ref-tech-stack.md` |
| ref-project-structure.md | Yes | `refs/ref-project-structure.md` |
| ref-schema-foundation.md | Yes | `refs/ref-schema-foundation.md` |
| ref-schema-core.md | Yes | `refs/ref-schema-core.md` |
| ref-schema-operations.md | Yes | `refs/ref-schema-operations.md` |
| ref-state-machine.md | Yes | `refs/ref-state-machine.md` |
| ref-golden-module.md | Yes | `refs/ref-golden-module.md` |
| ref-features-f01-f04.md | Yes | `refs/ref-features-f01-f04.md` |
| ref-features-f05-f10.md | Yes | `refs/ref-features-f05-f10.md` |
| ref-ux-screens.md | Yes | `refs/ref-ux-screens.md` |
| ref-ux-vietnam.md | Yes | `refs/ref-ux-vietnam.md` |
| ref-seed-data.md | Yes | `refs/ref-seed-data.md` |
| ref-rbac-matrix.md | Yes | `refs/ref-rbac-matrix.md` |
| ref-integrations.md | Yes | `refs/ref-integrations.md` |
| ref-handover-templates.md | Yes | `refs/ref-handover-templates.md` |

**Total**: 16 files created (1 CONVENTIONS + 15 reference files)

---

## pACS Self-Assessment

- **F (Faithfulness)**: 88/100 — The PRD is a meta-level document about a "SaaS Auto-Builder" CLI tool, not about ProjectOpsOS directly. Reference files adapt the PRD's architectural patterns (Next.js 15, Drizzle, Supabase Auth, RLS, module structure) to the ProjectOpsOS domain (project management with handovers, compliance, Vietnamese UI). The tech stack, security patterns, and module structure follow the PRD faithfully. Domain-specific schemas (projects, handovers, compliance) are inferred from the PRD's architectural patterns rather than extracted verbatim, since the PRD describes a code generator, not the target app itself.

- **C (Completeness)**: 92/100 — All 16 required files created. Each reference file exceeds 200 lines with structured, detailed content. Vietnamese labels cover 22 categories. Schema files include Drizzle definitions, RLS policies, indexes, relations, and Zod validation. The RBAC matrix covers all 10 modules x 5 roles. Integration points documented with TypeScript event payloads. Minor gap: some generated SaaS-specific patterns (Stripe webhooks, pgvector) from the PRD are less relevant to ProjectOpsOS and were adapted accordingly.

- **L (Lucidity)**: 93/100 — Consistent formatting across all files. Each file starts with a SOT declaration. Tables, code blocks, and mermaid diagrams used appropriately. Hierarchical structure within each file. Cross-references between files (e.g., ref-state-machine.md referenced from ref-schema-core.md).

- **T (Testability)**: 90/100 — Agents can read any reference file and implement without ambiguity. Zod schemas are copy-pasteable. Drizzle table definitions are complete. Vietnamese labels are in key-value format ready for direct use. RBAC matrix has both detailed and condensed views. Handover templates have concrete item lists. Minor concern: some implementation details (e.g., exact query patterns) may need adaptation during actual development.

- **pACS = min(F, C, L, T) = 88/100**

---

*Generated by @schema-architect | Step 1 of workflow*

# Step 17: Tasks Module — Build Report

**Date:** 2026-03-19
**Status:** COMPLETE

---

## Files Created (13 files)

### Module Core
| File | Lines | Description |
|------|-------|-------------|
| `src/modules/tasks/types.ts` | 115 | TaskStatus, TaskType, TaskPriority Zod enums; TaskRow, TaskCommentRow DB types; TaskListItem, TaskDetail, KanbanColumn interfaces; TaskFormSchema, TaskFilterSchema, PaginatedResult<T> |
| `src/modules/tasks/constants.ts` | 160 | TASK_STATUS_LABELS (Vietnamese), TASK_STATUS_COLORS, TASK_STATUS_ICONS, ALLOWED_TASK_TRANSITIONS, TASK_TYPE_LABELS, TASK_TYPE_COLORS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, KANBAN_COLUMNS, VALIDATION, PERMISSIONS, FILTER_PRESETS |
| `src/modules/tasks/validation.ts` | 80 | createTaskSchema (with dueDate >= startDate refinement), updateTaskSchema (.partial() + same refinement), transitionTaskStatusSchema (validates against ALLOWED_TASK_TRANSITIONS), taskFiltersSchema |
| `src/modules/tasks/queries.ts` | 250 | getTasks (paginated + search + sort), getTaskById (full relations), getTasksByProject, getTasksKanban (4-column grouping), getOverdueTasks, getTaskStats (aggregate) |
| `src/modules/tasks/actions.ts` | 210 | createTask, updateTask, transitionTaskStatus (TOCTOU-safe), assignTask, deleteTask — all using createAction wrapper + audit logging |

### UI Components
| File | Description |
|------|-------------|
| `src/modules/tasks/components/task-list.tsx` | Table view with search, status/priority/type filters, pagination, overdue row highlighting (red bg) |
| `src/modules/tasks/components/task-detail.tsx` | Detail view with status transition bar + confirmation dialog, two-column layout (content + sidebar info cards) |
| `src/modules/tasks/components/task-form.tsx` | Create/edit form with Zod client-side validation, project selector, assignee selector, date pickers, priority/type/status selects |
| `src/modules/tasks/components/task-kanban.tsx` | 4-column Kanban board (Cần làm / Đang thực hiện / Đang đánh giá / Hoàn thành) with task cards, overdue indicators, priority color bar |
| `src/modules/tasks/components/task-status-badge.tsx` | Badge reading from TASK_STATUS_LABELS + TASK_STATUS_COLORS |
| `src/modules/tasks/components/task-priority-badge.tsx` | Badge reading from TASK_PRIORITY_LABELS + TASK_PRIORITY_COLORS |
| `src/modules/tasks/components/index.ts` | Barrel re-export |

### Page Routes
| File | Description |
|------|-------------|
| `src/app/(dashboard)/tasks/page.tsx` | Server component — parses searchParams, calls getTasks(), renders TaskList |
| `src/app/(dashboard)/tasks/[id]/page.tsx` | Server component — calls getTaskById(), returns notFound() if null |
| `src/app/(dashboard)/tasks/[id]/task-detail-client.tsx` | Client wrapper — bridges transitionTaskStatus action to TaskDetail via useCallback + router.refresh() |

### Tests
| File | Tests |
|------|-------|
| `tests/modules/tasks/tasks.test.ts` | 88 tests — validation boundary tests, transition matrix (all allowed/disallowed), filter defaults, constants coverage, action/query export verification |

---

## State Machine

Task status flow (7 statuses, ALLOWED_TASK_TRANSITIONS):
```
backlog → todo → in_progress → in_review → testing → done
                    ↑ ↓ backwards allowed      ↑
All active states → cancelled (terminal)
cancelled → backlog (recovery)
done (terminal — no outgoing)
```

Kanban board shows 4 statuses: `todo`, `in_progress`, `in_review`, `done`

---

## Key Design Decisions

1. **No slug for tasks** — Tasks use `id` (UUID) in routes (`/tasks/[id]`) rather than slug, consistent with the schema (tasks table has no slug column).
2. **TOCTOU protection on transitions** — `transitionTaskStatus` re-reads DB status before atomic `WHERE status = actualStatus` update, same pattern as `transitionStageAction` in projects.
3. **Soft delete** — Tasks use `deletedAt` timestamp (not `isArchived` boolean) to match the `tasks` table schema.
4. **Overdue detection** — Computed at query time via `dueDate < today AND status NOT IN ('done', 'cancelled')`. Highlighted red in list and Kanban.
5. **Reporter name in list** — Omitted from list view (would require a second users JOIN alias), available in detail view via relations.

---

## pACS Self-Rating

| Dimension | Score | Notes |
|-----------|-------|-------|
| **F (Faithfulness)** | 5/5 | Followed golden-module-pattern.md exactly: file order, naming conventions, ActionResult type, createAction wrapper, audit logging, revalidatePath, TOCTOU protection, escapeLikePattern, SORT_COLUMN_MAP, Promise.all() parallel queries |
| **C (Completeness)** | 5/5 | All 13 files created as specified. All 5 actions, 6 queries, 4 components + 2 badges + barrel + 2 page routes + client wrapper. 88 tests covering validation boundaries, transition matrix, constants coverage, export verification |
| **L (Language)** | 5/5 | All UI text Vietnamese per ref-ux-vietnam.md. Labels verified: Tồn đọng, Cần làm, Đang thực hiện, Đang đánh giá, Đang kiểm thử, Hoàn thành, Đã hủy. Vietnamese error messages in validation and actions |
| **T (Tests)** | 5/5 | 88/88 tests pass. Zero TypeScript errors (`pnpm exec tsc --noEmit` clean). Test mocks follow the same pattern as projects/actions.test.ts to handle next-auth transitive dependency |

**Overall pACS: F5 C5 L5 T5 — PASS**

---

## Verification

```
pnpm exec tsc --noEmit     → 0 errors
pnpm exec vitest run tests/modules/tasks/    → 88/88 passed
```

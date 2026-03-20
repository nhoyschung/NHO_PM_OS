# Step 25: Notification Triggers + Email — Build Report

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `src/lib/notification-triggers.ts` | Internal notification trigger service (5 functions) |
| 2 | `src/lib/notification-triggers.test.ts` | Unit tests — 15 test cases with mocked DB |
| 3 | `src/lib/email.ts` | Email stub with Vietnamese templates |

## Deliverables

### 25.1 Notification Trigger Service (`src/lib/notification-triggers.ts`)

Five trigger functions, each inserting directly into the `notifications` table via `db.insert`:

| Function | Event | NotificationType | Priority | Recipients |
|----------|-------|-------------------|----------|------------|
| `notifyProjectStageChange` | Project stage transition | `project_stage_changed` | normal | All project members except trigger user |
| `notifyHandoverStatusChange` | Handover status update | `handover_initiated` / `handover_approved` / `handover_rejected` | normal / high (rejected) | fromUser + toUser except trigger user |
| `notifyTaskAssigned` | Task assignment | `task_assigned` | normal | Assignee (skips self-assignment) |
| `notifyTaskOverdue` | Task past due date | `deadline_overdue` | high | Assignee |
| `notifyFinanceApproval` | Financial record approval/rejection | `system_alert` | normal / high (rejected) | Record creator (skips self-approval) |

Key design decisions:
- **Not server actions** — internal helpers called from within existing `createAction`-wrapped actions
- **Vietnamese messages** — all titles and messages use Vietnamese, referencing labels from module constants (`STAGE_LABELS`, `STATUS_LABELS`, `FINANCE_STATUS_LABELS`)
- **linkUrl included** — each notification has `actionUrl` for navigation (e.g., `/dashboard/projects`, `/dashboard/tasks/{id}`)
- **Self-notification prevention** — trigger user is always excluded from recipients

### 25.2 Test Suite (`src/lib/notification-triggers.test.ts`)

15 test cases covering:
- Correct notification type/priority per event
- Vietnamese message content verification
- Self-notification exclusion
- Multi-recipient fan-out (project stage change)
- actionUrl correctness
- DB mock with `vi.mock`

### 25.3 Email Stub (`src/lib/email.ts`)

- `sendEmail(to, subject, body)` — console.log stub, returns `{ success: true }`
- `sendNotificationEmail(userId, notification)` — console.log stub
- `EMAIL_TEMPLATES` — Vietnamese email body templates for all 5 trigger events
- All functions marked with `TODO` comments for future provider integration

## Integration Guide

These trigger functions should be called from existing server actions:

```typescript
// In projects/actions.ts → transitionStageAction, after stage update:
import { notifyProjectStageChange } from '@/lib/notification-triggers';
await notifyProjectStageChange({ projectId, projectName, fromStage, toStage, triggeredBy: userId, memberUserIds });

// In handovers/actions.ts → after status change:
import { notifyHandoverStatusChange } from '@/lib/notification-triggers';
await notifyHandoverStatusChange({ handoverId, handoverTitle, status, triggeredBy: userId, fromUserId, toUserId });

// In tasks/actions.ts → after assignment:
import { notifyTaskAssigned } from '@/lib/notification-triggers';
await notifyTaskAssigned({ taskId, taskTitle, assigneeId, assignedBy: userId, projectId });
```

## Verification

```
pnpm exec tsc --noEmit  →  0 errors
```

## pACS Self-Rating

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F — Faithfulness** | 5 | All 5 trigger functions implemented per spec. Vietnamese messages. Named exports. Not server actions. linkUrl included. |
| **C — Completeness** | 5 | Trigger service, test suite, and email stub all delivered. Integration documented. |
| **L — Literacy** | 5 | Follows CONVENTIONS.md: camelCase functions, named exports, Drizzle patterns match existing actions.ts. |
| **T — Testability** | 4 | 15 unit tests with mocked DB. Integration tests deferred to Step 29 (Gate 4). |

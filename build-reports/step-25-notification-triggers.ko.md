# Step 25: 알림 트리거 + 이메일 — 빌드 리포트

## 생성된 파일

| # | 파일 | 용도 |
|---|------|------|
| 1 | `src/lib/notification-triggers.ts` | 내부 알림 트리거 서비스 (5개 함수) |
| 2 | `src/lib/notification-triggers.test.ts` | 단위 테스트 — DB 모킹 포함 15개 테스트 케이스 |
| 3 | `src/lib/email.ts` | 베트남어 템플릿 포함 이메일 스텁 |

## 산출물

### 25.1 알림 트리거 서비스 (`src/lib/notification-triggers.ts`)

5개 트리거 함수로, 각각 `db.insert`를 통해 `notifications` 테이블에 직접 삽입:

| 함수 | 이벤트 | NotificationType | 우선순위 | 수신자 |
|------|--------|-------------------|----------|--------|
| `notifyProjectStageChange` | 프로젝트 단계 전이 | `project_stage_changed` | normal | 트리거 사용자를 제외한 모든 프로젝트 멤버 |
| `notifyHandoverStatusChange` | 인수인계 상태 업데이트 | `handover_initiated` / `handover_approved` / `handover_rejected` | normal / high (거부 시) | 트리거 사용자를 제외한 fromUser + toUser |
| `notifyTaskAssigned` | 작업 배정 | `task_assigned` | normal | 담당자 (자기 배정 시 건너뜀) |
| `notifyTaskOverdue` | 작업 기한 초과 | `deadline_overdue` | high | 담당자 |
| `notifyFinanceApproval` | 재무 기록 승인/거부 | `system_alert` | normal / high (거부 시) | 기록 생성자 (자기 승인 시 건너뜀) |

주요 설계 결정:
- **서버 액션이 아님** — 기존 `createAction` 래핑 액션 내부에서 호출되는 내부 헬퍼
- **베트남어 메시지** — 모든 제목과 메시지가 모듈 상수의 라벨(`STAGE_LABELS`, `STATUS_LABELS`, `FINANCE_STATUS_LABELS`)을 참조하여 베트남어로 작성
- **linkUrl 포함** — 각 알림에 내비게이션용 `actionUrl` 포함 (예: `/dashboard/projects`, `/dashboard/tasks/{id}`)
- **자기 알림 방지** — 트리거 사용자는 항상 수신자에서 제외

### 25.2 테스트 스위트 (`src/lib/notification-triggers.test.ts`)

다음을 커버하는 15개 테스트 케이스:
- 이벤트별 올바른 알림 타입/우선순위
- 베트남어 메시지 내용 검증
- 자기 알림 제외
- 다중 수신자 팬아웃 (프로젝트 단계 변경)
- actionUrl 정확성
- `vi.mock`을 이용한 DB 모킹

### 25.3 이메일 스텁 (`src/lib/email.ts`)

- `sendEmail(to, subject, body)` — console.log 스텁, `{ success: true }` 반환
- `sendNotificationEmail(userId, notification)` — console.log 스텁
- `EMAIL_TEMPLATES` — 5개 트리거 이벤트 전체에 대한 베트남어 이메일 본문 템플릿
- 모든 함수에 향후 프로바이더 연동을 위한 `TODO` 주석 표기

## 연동 가이드

이 트리거 함수들은 기존 서버 액션에서 호출해야 한다:

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

## 검증

```
pnpm exec tsc --noEmit  →  0 errors
```

## pACS 자체 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F — 충실도** | 5 | 명세에 따라 5개 트리거 함수 모두 구현. 베트남어 메시지. Named export. 서버 액션이 아님. linkUrl 포함. |
| **C — 완전성** | 5 | 트리거 서비스, 테스트 스위트, 이메일 스텁 모두 납품. 연동 문서화 완료. |
| **L — 문해성** | 5 | CONVENTIONS.md 준수: camelCase 함수, Named export, 기존 actions.ts와 일치하는 Drizzle 패턴. |
| **T — 테스트 가능성** | 4 | DB 모킹 포함 15개 단위 테스트. 통합 테스트는 Step 29(Gate 4)로 이연. |

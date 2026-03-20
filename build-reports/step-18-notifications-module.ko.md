# Step 18: 알림(Notifications) 모듈 — 빌드 리포트

**날짜:** 2026-03-19
**에이전트:** Module Replicator
**모듈:** Notifications (`/dashboard/notifications`)

---

## 생성된 파일

### 모듈 코어 (5개 파일)

| 파일 | 용도 |
|------|------|
| `src/modules/notifications/types.ts` | `NotificationType`, `NotificationPriority` Zod 열거형; `NotificationRow`, `NotificationListItem`, `UnreadCount`; `NotificationFilterSchema`, `PaginatedResult<T>` |
| `src/modules/notifications/constants.ts` | `NOTIFICATION_TYPE_LABELS` (14가지 유형, 베트남어), `NOTIFICATION_TYPE_ICONS`, `NOTIFICATION_TYPE_COLORS`, `NOTIFICATION_PRIORITY_LABELS`, `NOTIFICATION_PRIORITY_COLORS`, `POLL_INTERVAL_MS` (30초), `VALIDATION`, `PERMISSIONS`, `FILTER_PRESETS` |
| `src/modules/notifications/validation.ts` | `createNotificationSchema`, `markAsReadSchema`, `notificationFiltersSchema` 재내보내기 |
| `src/modules/notifications/queries.ts` | `getNotifications(userId, filters)`, `getUnreadCount(userId)`, `getNotificationById(id)` |
| `src/modules/notifications/actions.ts` | `createNotification`, `markAsRead`, `markAllAsRead`, `deleteNotification` — 모두 `createAction` 래퍼 사용 |

### 컴포넌트 (4개 파일)

| 파일 | 용도 |
|------|------|
| `src/modules/notifications/components/notification-item.tsx` | 유형 배지, 읽음/미읽음 스타일링, 읽음 표시 및 삭제 액션이 포함된 단일 알림 행 |
| `src/modules/notifications/components/notification-list.tsx` | 유형 + 읽음/미읽음 필터, 페이지네이션, 모두 읽음 표시가 포함된 전체 목록 |
| `src/modules/notifications/components/notification-bell.tsx` | 미읽음 배지 카운터가 포함된 헤더 벨, `POLL_INTERVAL_MS`를 통한 SWR 스타일 폴링 |
| `src/modules/notifications/components/index.ts` | Barrel 재내보내기 |

### 페이지 라우트 (1개 파일)

| 파일 | 용도 |
|------|------|
| `src/app/(dashboard)/notifications/page.tsx` | 서버 컴포넌트: 인증 확인, 알림 + 미읽음 카운트 병렬 조회, `NotificationList` 렌더링 |

### 테스트 (1개 파일)

| 파일 | 테스트 수 |
|------|-----------|
| `tests/modules/notifications/notifications.test.ts` | 33개 테스트: `createNotificationSchema` (11개 케이스), `markAsReadSchema` (3개 케이스), `NotificationFilterSchema` (7개 케이스), `getUnreadCount` 형태 (2개), `getNotifications` 형태 (2개), `getNotificationById` 내보내기 (1개), 액션 내보내기 (4개), 인증 거부 (1개), 유효성 검증 거부 (2개) |

---

## 주요 설계 결정

1. **`getNotifications`는 사용자 범위 한정**: 항상 `userId`를 첫 번째 `WHERE` 조건으로 필터링한다. 사용자 간 데이터 유출이 없다.
2. **`getUnreadCount`는 3개 병렬 쿼리 실행**: 전체 미읽음 + 긴급 카운트 + 높음 카운트 — 벨 배지의 색상 로직에 데이터를 제공한다 (`urgent` = 빨강, 나머지 = 파랑).
3. **`NotificationBell`은 SWR 스타일 폴링 사용**: `useEffect` 내부의 `setInterval(POLL_INTERVAL_MS)`로 전체 페이지 새로고침 없이 벨 카운터를 갱신한다.
4. **`markAllAsRead`는 `Record<string, never>` 수용**: 필수 입력이 없음을 전달하면서 `createAction`의 `TInput` 타입 매개변수를 충족시킨다.
5. **`deleteNotification`은 하드 삭제**: 알림은 삭제 후 비즈니스 가치가 없으므로 소프트 삭제가 불필요하다 (스키마에 `deletedAt` 컬럼 없음).
6. **slug 없음**: 알림에는 사람이 읽을 수 있는 slug가 없다. `getNotificationById`가 유일하게 필요한 조회이다.

---

## pACS 자기 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F — 기능적 정확성** | 5/5 | 33개 테스트 전체 통과; `tsc --noEmit` 에러 없음; 모든 CRUD 액션이 `createAction` 래퍼 사용; 인증 게이트 적용 |
| **C — 규칙 준수** | 5/5 | Named export만 사용; golden-module-pattern.md를 정확히 따름; UI 텍스트 전체 베트남어; `UPPER_SNAKE_CASE` 상수; camelCase 함수 |
| **L — 언어 / UI 텍스트** | 5/5 | `ref-ux-vietnam.md §12`의 14가지 알림 유형 라벨 전체 베트남어; 빈 상태, 버튼, 필터 베트남어 |
| **T — 테스트 커버리지** | 5/5 | 33개 테스트 커버: 스키마 수용 + 9개 거부 케이스, 필터 기본값 + 5개 경계값 거부, 쿼리 형태 검증, 액션 내보내기, 인증 거부, 액션을 통한 유효성 검증 거부 |

**전체: F5 C5 L5 T5**

---

## 검증

```
pnpm exec tsc --noEmit    → 0 errors (notifications 모듈)
pnpm exec vitest run tests/modules/notifications/
→ 33/33 passed
```

---

*Module Replicator 생성 — ProjectOpsOS Phase 3, Step 18.*

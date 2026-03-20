# Step 17: 작업(Tasks) 모듈 — 빌드 리포트

**날짜:** 2026-03-19
**상태:** 완료

---

## 생성된 파일 (13개)

### 모듈 코어
| 파일 | 라인 수 | 설명 |
|------|---------|------|
| `src/modules/tasks/types.ts` | 115 | TaskStatus, TaskType, TaskPriority Zod 열거형; TaskRow, TaskCommentRow DB 타입; TaskListItem, TaskDetail, KanbanColumn 인터페이스; TaskFormSchema, TaskFilterSchema, PaginatedResult<T> |
| `src/modules/tasks/constants.ts` | 160 | TASK_STATUS_LABELS (베트남어), TASK_STATUS_COLORS, TASK_STATUS_ICONS, ALLOWED_TASK_TRANSITIONS, TASK_TYPE_LABELS, TASK_TYPE_COLORS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, KANBAN_COLUMNS, VALIDATION, PERMISSIONS, FILTER_PRESETS |
| `src/modules/tasks/validation.ts` | 80 | createTaskSchema (dueDate >= startDate 정제 포함), updateTaskSchema (.partial() + 동일 정제), transitionTaskStatusSchema (ALLOWED_TASK_TRANSITIONS 대비 검증), taskFiltersSchema |
| `src/modules/tasks/queries.ts` | 250 | getTasks (페이지네이션 + 검색 + 정렬), getTaskById (전체 관계), getTasksByProject, getTasksKanban (4열 그룹화), getOverdueTasks, getTaskStats (집계) |
| `src/modules/tasks/actions.ts` | 210 | createTask, updateTask, transitionTaskStatus (TOCTOU 안전), assignTask, deleteTask — 모두 createAction 래퍼 + 감사 로깅 사용 |

### UI 컴포넌트
| 파일 | 설명 |
|------|------|
| `src/modules/tasks/components/task-list.tsx` | 검색, 상태/우선순위/유형 필터, 페이지네이션, 기한 초과 행 하이라이트(빨간 배경)가 포함된 테이블 보기 |
| `src/modules/tasks/components/task-detail.tsx` | 상태 전이 바 + 확인 다이얼로그, 2열 레이아웃(콘텐츠 + 사이드바 정보 카드)이 포함된 상세 보기 |
| `src/modules/tasks/components/task-form.tsx` | Zod 클라이언트측 유효성 검증, 프로젝트 선택기, 담당자 선택기, 날짜 선택기, 우선순위/유형/상태 셀렉트를 갖춘 생성/수정 폼 |
| `src/modules/tasks/components/task-kanban.tsx` | 4열 칸반 보드 (Cần làm / Đang thực hiện / Đang đánh giá / Hoàn thành), 작업 카드, 기한 초과 표시기, 우선순위 색상 바 포함 |
| `src/modules/tasks/components/task-status-badge.tsx` | TASK_STATUS_LABELS + TASK_STATUS_COLORS에서 읽는 배지 |
| `src/modules/tasks/components/task-priority-badge.tsx` | TASK_PRIORITY_LABELS + TASK_PRIORITY_COLORS에서 읽는 배지 |
| `src/modules/tasks/components/index.ts` | Barrel 재내보내기 |

### 페이지 라우트
| 파일 | 설명 |
|------|------|
| `src/app/(dashboard)/tasks/page.tsx` | 서버 컴포넌트 — searchParams 파싱, getTasks() 호출, TaskList 렌더링 |
| `src/app/(dashboard)/tasks/[id]/page.tsx` | 서버 컴포넌트 — getTaskById() 호출, null이면 notFound() 반환 |
| `src/app/(dashboard)/tasks/[id]/task-detail-client.tsx` | 클라이언트 래퍼 — useCallback + router.refresh()를 통해 transitionTaskStatus 액션을 TaskDetail에 연결 |

### 테스트
| 파일 | 테스트 수 |
|------|-----------|
| `tests/modules/tasks/tasks.test.ts` | 88개 테스트 — 유효성 검증 경계값 테스트, 전이 행렬 (모든 허용/비허용), 필터 기본값, 상수 커버리지, 액션/쿼리 내보내기 검증 |

---

## 상태 머신

작업 상태 흐름 (7개 상태, ALLOWED_TASK_TRANSITIONS):
```
backlog → todo → in_progress → in_review → testing → done
                    ↑ ↓ backwards allowed      ↑
All active states → cancelled (terminal)
cancelled → backlog (recovery)
done (terminal — no outgoing)
```

칸반 보드는 4가지 상태를 표시: `todo`, `in_progress`, `in_review`, `done`

---

## 주요 설계 결정

1. **작업에 slug 없음** — 작업은 스키마(tasks 테이블에 slug 컬럼이 없음)와 일관되게 라우트(`/tasks/[id]`)에서 slug 대신 `id` (UUID)를 사용한다.
2. **전이 시 TOCTOU 보호** — `transitionTaskStatus`는 원자적 `WHERE status = actualStatus` 업데이트 전에 DB 상태를 다시 읽는다. projects의 `transitionStageAction`과 동일한 패턴이다.
3. **소프트 삭제** — 작업은 `tasks` 테이블 스키마와 일치하도록 `isArchived` 불리언이 아닌 `deletedAt` 타임스탬프를 사용한다.
4. **기한 초과 감지** — 쿼리 시점에 `dueDate < today AND status NOT IN ('done', 'cancelled')`로 계산한다. 목록과 칸반에서 빨간색으로 강조 표시된다.
5. **목록에서 보고자 이름 생략** — 목록 보기에서 생략 (두 번째 users JOIN 별칭이 필요함), 상세 보기에서 관계를 통해 제공.

---

## pACS 자기 평가

| 차원 | 점수 | 비고 |
|------|------|------|
| **F (충실도)** | 5/5 | golden-module-pattern.md를 정확히 따름: 파일 순서, 네이밍 컨벤션, ActionResult 타입, createAction 래퍼, 감사 로깅, revalidatePath, TOCTOU 보호, escapeLikePattern, SORT_COLUMN_MAP, Promise.all() 병렬 쿼리 |
| **C (완전성)** | 5/5 | 명시된 13개 파일 모두 생성. 5개 액션, 6개 쿼리, 4개 컴포넌트 + 2개 배지 + barrel + 2개 페이지 라우트 + 클라이언트 래퍼. 유효성 검증 경계값, 전이 행렬, 상수 커버리지, 내보내기 검증을 포함하는 88개 테스트 |
| **L (언어)** | 5/5 | 모든 UI 텍스트를 ref-ux-vietnam.md에 따라 베트남어 적용. 라벨 검증 완료: Tồn đọng, Cần làm, Đang thực hiện, Đang đánh giá, Đang kiểm thử, Hoàn thành, Đã hủy. 유효성 검증 및 액션에 베트남어 에러 메시지 |
| **T (테스트)** | 5/5 | 88/88 테스트 통과. TypeScript 에러 없음 (`pnpm exec tsc --noEmit` 클린). 테스트 모킹은 next-auth 전이적 의존성 처리를 위해 projects/actions.test.ts와 동일한 패턴을 따름 |

**전체 pACS: F5 C5 L5 T5 — PASS**

---

## 검증

```
pnpm exec tsc --noEmit     → 0 errors
pnpm exec vitest run tests/modules/tasks/    → 88/88 passed
```

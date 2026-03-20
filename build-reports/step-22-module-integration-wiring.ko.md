# Step 22 — 모듈 통합 와이어링

**상태**: 완료
**날짜**: 2026-03-19
**에이전트**: RBAC Integrator

---

## 22.1 사이드바 내비게이션

`src/components/layout/sidebar.tsx`에 7개 모듈 내비게이션 항목을 모두 반영했다:

| 라벨 (베트남어) | 라우트 | 아이콘 | 가시성 |
|---|---|---|---|
| Tổng quan | /dashboard | LayoutDashboard | 전체 |
| Dự án | /dashboard/projects | FolderKanban | 전체 |
| Bàn giao | /dashboard/handovers | ArrowRightLeft | 전체 |
| Tài liệu | /dashboard/documents | FileText | 전체 |
| Công việc | /dashboard/tasks | CheckSquare | 전체 |
| Tài chính | /dashboard/finance | DollarSign | admin, manager |
| Nhật ký | /dashboard/audit-logs | ScrollText | admin, manager |
| Thông báo | /dashboard/notifications | Bell | 전체 |

더 이상 사용하지 않는 항목을 제거했다: Báo cáo (/dashboard/reports), Tuân thủ (/dashboard/compliance), 기존 /dashboard/financials 및 /dashboard/audit-log 라우트.

## 22.2 모듈 인덱스 파일

7개 모듈 전체와 최상위 애그리게이터에 대한 Barrel export를 생성했다:

| 모듈 | 파일 | 내보내기 |
|---|---|---|
| projects | `src/modules/projects/index.ts` | 7개 컴포넌트 + PERMISSIONS |
| handovers | `src/modules/handovers/index.ts` | 5개 컴포넌트 + PERMISSIONS |
| documents | `src/modules/documents/index.ts` | 5개 컴포넌트 + PERMISSIONS |
| tasks | `src/modules/tasks/index.ts` | 6개 컴포넌트 + PERMISSIONS |
| notifications | `src/modules/notifications/index.ts` | 3개 컴포넌트 + PERMISSIONS |
| audit-logs | `src/modules/audit-logs/index.ts` | 5개 컴포넌트 + PERMISSIONS |
| finance | `src/modules/finance/index.ts` | 5개 컴포넌트 + PERMISSIONS |
| **barrel** | `src/modules/index.ts` | 전체 36개 컴포넌트 + PermissionGuard |

설계 참고: 서버 액션(`'use server'`)과 쿼리는 Next.js 모듈 경계 문제를 방지하기 위해 barrel 파일을 통해 재내보내기하지 않는다. 직접 임포트해야 한다 (예: `import { createProjectAction } from '@/modules/projects/actions'`).

## 22.3 와이어링된 모듈 — 파일 수

| 모듈 | 파일 수 |
|---|---|
| projects | 14 |
| handovers | 12 |
| documents | 12 |
| tasks | 13 |
| notifications | 10 |
| audit-logs | 12 |
| finance | 12 |
| **합계** | **85** |

## 22.4 통합 테스트

`tests/integration/module-wiring.test.ts`에 5개 테스트 그룹을 생성했다:

1. **모듈 디렉터리 구조** — 7개 모듈 전체에 필수 파일이 존재하는지 확인 (actions.ts, constants.ts, queries.ts, types.ts, validation.ts, index.ts, components/index.ts)
2. **사이드바 내비게이션** — 모든 예상 라우트가 베트남어 라벨과 함께 존재하는지 확인
3. **RBAC 권한 매트릭스** — 모든 모듈이 PERMISSIONS를 내보내는지, rbac.ts가 7개 모듈 전체에서 임포트하는지 확인
4. **서버 액션 래퍼** — 모든 모듈이 createAction을 임포트하고 'use server'를 사용하는지 확인
5. **모듈 Barrel export** — 최상위 인덱스가 7개 모듈 전체를 참조하는지, 각 모듈이 ./components에서 재내보내기하는지 확인

## 22.5 TypeScript 검사

```
pnpm exec tsc --noEmit → 0 errors
```

## 22.6 전체 테스트 스위트 결과

```
Test Files  12 passed (12)
     Tests  577 passed (577)
  Duration  1.07s
```

**실패 0건.** 577개 테스트 전체 통과.

## pACS 평가

| 차원 | 점수 | 근거 |
|---|---|---|
| **F** (기능 완전성) | 95 | 7개 모듈 전체 와이어링 완료, 사이드바 완성, Barrel export 생성, 통합 테스트 통과 |
| **C** (코드 품질) | 95 | Named export만 사용, 일관된 패턴, 베트남어 라벨, 적절한 Next.js 모듈 경계 처리 |
| **L** (린팅/타입) | 100 | tsc --noEmit 에러 0건 통과 |
| **T** (테스트 커버리지) | 95 | 577개 테스트 통과, 새로운 통합 테스트가 와이어링, 사이드바, RBAC, 액션 래퍼를 다룸 |

**종합**: 96/100

# Step 24: BOD 대시보드 — 빌드 리포트

## 요약

ProjectOpsOS의 메인 BOD(이사회) 대시보드를 생성했다. 이 대시보드는 로그인 후 랜딩 페이지(`/dashboard`)이며, 모든 모듈에 걸친 집계 지표, 차트, 최근 활동을 표시한다.

## 생성된 파일

| 파일 | 용도 |
|------|------|
| `src/modules/dashboard/types.ts` | `DashboardStats`, `StatCardData` 타입 정의 |
| `src/modules/dashboard/queries.ts` | `getDashboardStats()` — 모든 모듈에서 병렬 집계 |
| `src/modules/dashboard/components/stat-cards.tsx` | 6개 통계 카드 (프로젝트, 활성, 기한 초과 작업, 대기 중 인수인계, 재무 잔액, 완료 작업) |
| `src/modules/dashboard/components/project-stage-chart.tsx` | CSS 기반 수평 막대 차트 — 베트남어 라벨이 포함된 단계별 프로젝트 수 |
| `src/modules/dashboard/components/task-overview.tsx` | 작업 상태 분류 — 백분율 바 + 기한 초과 강조 표시 |
| `src/modules/dashboard/components/recent-activity.tsx` | 활동 타임라인 — 최근 10개 감사 로그 항목에 액션 배지, 엔티티 링크, 상대 타임스탬프 포함 |
| `src/modules/dashboard/components/index.ts` | 모든 컴포넌트의 Barrel export |
| `src/modules/dashboard/index.ts` | 모듈 Barrel export |

## 수정된 파일

| 파일 | 변경사항 |
|------|----------|
| `src/app/(dashboard)/page.tsx` | 플레이스홀더를 실제 서버 컴포넌트로 교체 — 통계 페칭, 인증 확인, RBAC 기반 렌더링 |
| `src/modules/index.ts` | 대시보드 모듈 Barrel export 추가 |

## 아키텍처 결정사항

1. **서버 컴포넌트 페이지**: `page.tsx`는 렌더링 전에 `getDashboardStats()`를 통해 모든 대시보드 데이터를 가져오는 비동기 서버 컴포넌트다. 클라이언트 컴포넌트는 props로만 데이터를 수신하며, 클라이언트 측 페칭은 없다.

2. **병렬 데이터 페칭**: `getDashboardStats()`는 `Promise.all`을 사용하여 프로젝트 통계, 작업 통계, 재무 요약, 대기 중 인수인계 수, 최근 활동을 동시에 가져와 워터폴 지연을 최소화한다.

3. **CSS 전용 차트**: `ProjectStageChart`와 `TaskOverview` 모두 Tailwind CSS `width` 백분율 바를 사용하며, 외부 차트 라이브러리가 필요하지 않다.

4. **RBAC 적용**:
   - 인증 확인으로 미인증 사용자를 `/login`으로 리다이렉트
   - 최근 활동 섹션은 `isRoleAtLeast()`를 통해 `manager` 및 `admin` 역할에게만 표시
   - 모든 역할이 통계 카드와 차트를 볼 수 있음 (읽기 전용 데이터)

5. **shadcn/ui 의존성 없음**: 기존 코드베이스 패턴에 맞춰 컴포넌트는 Tailwind 클래스가 적용된 원시 HTML 엘리먼트를 사용 (다른 모듈에서 `cn()` + 원시 엘리먼트를 사용하는 것과 동일, shadcn 컴포넌트 미사용).

6. **베트남어 UI**: 모든 사용자 대면 텍스트가 `ref-ux-vietnam.md` 라벨과 일관되게 베트남어로 작성됨.

## 데이터 소스

| 컴포넌트 | 쿼리 | 모듈 |
|----------|------|------|
| StatCards | `getProjectStats()` | projects |
| StatCards | `getTaskStats()` | tasks |
| StatCards | `getFinanceSummary()` | finance |
| StatCards | 대기 중 인수인계 수 | handovers (직접 DB 쿼리) |
| ProjectStageChart | `getProjectStats()`의 `countByStage` | projects |
| TaskOverview | `getTaskStats()` | tasks |
| RecentActivity | `getRecentActivity(10)` | audit-logs |

## 검증

```
pnpm exec tsc --noEmit  →  0 errors
```

## pACS 자체 평가

| 기준 | 점수 | 근거 |
|------|------|------|
| **F — 충실도** | 9/10 | 명세대로 6개 통계 카드, 2개 차트, 활동 타임라인 모두 구현. 기존 모듈 쿼리 활용. |
| **C — 완전성** | 9/10 | 명시된 파일 모두 생성. RBAC 적용. 베트남어 라벨. CSS 차트. 외부 라이브러리 미사용. |
| **L — 연결성** | 10/10 | projects, tasks, finance, handovers, audit-logs 모듈에서 올바르게 임포트. Barrel export 연결 완료. |
| **T — 타입 안전성** | 10/10 | `tsc --noEmit` 오류 0건 통과. 모든 props 타입 지정 완료. |

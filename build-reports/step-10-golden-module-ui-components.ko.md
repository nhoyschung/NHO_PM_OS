# Step 10: 골든 모듈 — UI 컴포넌트

**상태**: 완료
**날짜**: 2026-03-19
**TypeScript 검사**: PASS (오류 0건)

---

## 생성된 파일

| # | 파일 | 줄 수 | 용도 |
|---|------|-------|------|
| 1 | `src/modules/projects/components/stage-badge.tsx` | 28 | STAGE_COLORS 기반 단계 배지 |
| 2 | `src/modules/projects/components/priority-badge.tsx` | 28 | PRIORITY_COLORS 기반 우선순위 배지 |
| 3 | `src/modules/projects/components/health-badge.tsx` | 28 | HEALTH_COLORS 기반 상태 배지 |
| 4 | `src/modules/projects/components/project-list.tsx` | 388 | 전체 목록 뷰: 테이블, 검색, 필터, 페이지네이션 |
| 5 | `src/modules/projects/components/project-detail.tsx` | 464 | 상세 뷰: 탭, 사이드바, 단계 이력, 재무 |
| 6 | `src/modules/projects/components/project-form.tsx` | 272 | Zod 유효성 검증을 포함한 생성/수정 폼 |
| 7 | `src/modules/projects/components/stage-transition-bar.tsx` | 131 | 확인 다이얼로그가 포함된 단계 전환 바 |
| 8 | `src/modules/projects/components/index.ts` | 7 | Barrel export |
| 9 | `src/modules/projects/actions.ts` | 23 | 스텁 서버 액션 (전체 구현은 Step 11에서) |
| 10 | `src/app/(dashboard)/projects/page.tsx` | 48 | 서버 컴포넌트: 프로젝트 목록 페이지 |
| 11 | `src/app/(dashboard)/projects/[slug]/page.tsx` | 18 | 서버 컴포넌트: 프로젝트 상세 페이지 |
| 12 | `src/app/(dashboard)/projects/[slug]/project-detail-client.tsx` | 33 | 전환 액션을 바인딩하는 클라이언트 래퍼 |
| 13 | `src/app/(dashboard)/projects/new/page.tsx` | 5 | 서버 컴포넌트: 프로젝트 생성 페이지 |
| 14 | `src/app/(dashboard)/projects/new/project-form-client.tsx` | 14 | 생성 액션을 바인딩하는 클라이언트 래퍼 |

**신규 코드 총 줄 수**: 1,487
**수정된 파일**: `src/modules/projects/queries.ts` (+13줄 — `getProjectBySlug`)

---

## 컴포넌트 계층 구조

```
app/(dashboard)/projects/
├── page.tsx (Server)
│   └── ProjectList (Client)
│       ├── StageBadge
│       ├── PriorityBadge
│       └── HealthBadge
├── [slug]/
│   ├── page.tsx (Server)
│   └── ProjectDetailClient (Client)
│       └── ProjectDetail
│           ├── StageTransitionBar
│           ├── StageBadge / PriorityBadge / HealthBadge
│           ├── OverviewTab
│           ├── FinanceTab
│           ├── AuditTab
│           ├── InfoCard
│           └── MembersCard
└── new/
    ├── page.tsx (Server)
    └── ProjectFormClient (Client)
        └── ProjectForm
```

---

## 주요 설계 결정

1. **shadcn/ui 미사용**: `src/components/ui/`에 설치된 프리미티브가 없으므로 순수 Tailwind CSS를 사용한다. UI 컴포넌트 전용 단계에서 불필요한 의존성 추가를 방지하기 위함이다. 추후 shadcn/ui가 설치되면 배지/버튼을 점진적으로 교체할 수 있다.

2. **서버/클라이언트 분리**: 페이지는 서버 컴포넌트(데이터 페칭)로 구성한다. 대화형 요소(필터, 탭, 전환)는 `'use client'` 래퍼를 사용한다. 이는 Next.js App Router 모범 사례를 따른 것이다.

3. **URL 기반 필터 상태**: 필터와 페이지네이션을 `useSearchParams()` + `useRouter()`를 통해 URL 검색 파라미터에 저장한다. 이를 통해 다음이 가능해진다:
   - 공유 및 북마크 가능한 필터 상태
   - 브라우저 뒤로/앞으로 탐색
   - `getProjects()`를 통한 서버 사이드 필터링

4. **스텁 actions.ts**: UI가 컴파일되고 연결될 수 있도록 `createProjectAction`과 `transitionStageAction`의 최소 스텁을 생성했다. 전체 구현은 Step 11로 이관한다.

5. **queries.ts에 getProjectBySlug 추가**: 상세 페이지 라우트에서 `[slug]` 파라미터를 사용한다. 전체 관계 쿼리를 위해 `getProjectById`에 위임하는 slug-to-id 조회 함수를 추가했다.

6. **베트남어 UI 텍스트**: 모든 레이블은 `constants.ts`(STAGE_LABELS, PRIORITY_LABELS, HEALTH_LABELS)와 ref-ux-vietnam.md에서 가져온다. 유효성 검증 메시지는 validation.ts에 따라 베트남어로 작성되어 있다.

7. **Named export만 사용**: CONVENTIONS.md에 따라 모든 컴포넌트는 named export를 사용한다. Default export는 Next.js page.tsx 파일에만 사용한다(프레임워크 요구사항).

---

## pACS 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (기능성) | 85 | 명시된 모든 UI 화면을 생성했다. 액션은 스텁 상태이며 전체 기능은 Step 11에서 구현한다. |
| **C** (완전성) | 80 | 목록, 상세, 폼, 전환 바가 모두 존재한다. Handover/Document/Task 탭은 플레이스홀더이다(해당 모듈이 아직 존재하지 않으므로 올바른 처리). |
| **L** (연결성) | 90 | types.ts의 타입, constants.ts의 상수, queries.ts의 쿼리가 모두 올바르게 연결되어 있다. URL 라우팅이 ref-ux-screens.md 패턴과 일치한다. |
| **T** (TypeScript) | 95 | tsc 오류 0건. 전체적으로 엄격한 타이핑 적용. Zod 스키마의 브랜디드 타입을 적절히 사용했다. |

**종합**: 87.5 / 100

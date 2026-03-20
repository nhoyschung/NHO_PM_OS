# Step 8: 골든 모듈 — 스키마 & 타입

**상태**: 완료
**날짜**: 2026-03-19
**에이전트**: Schema Architect

---

## 생성된 파일

| 파일 | 라인 수 | 용도 |
|------|---------|------|
| `src/modules/projects/constants.ts` | 309 | 단계 레이블, 색상, 아이콘, 전이, 우선순위/건강 상태 레이블, 유효성 검증 규칙, RBAC 권한, 컬럼 가시성, 필터 프리셋 |
| `src/modules/projects/types.ts` | 184 | Zod enum 스키마, DB 행 타입, ProjectListItem, ProjectDetail, ProjectFormData, StageTransition, ProjectFilters, PaginatedResult |

**합계**: 2개 파일, 총 493라인

---

## 주요 설계 결정

### 1. Zod enum 값 이중 내보내기 (타입 + 런타임)

각 enum(ProjectStage, ProjectPriority, HealthStatus)은 Zod 스키마와 `z.infer`를 통한 TypeScript 타입 양쪽으로 내보내진다. 이를 통해 다음이 가능하다:
- 서버 액션에서의 런타임 유효성 검증 (`ProjectStage.parse(input)`)
- 컴포넌트에서의 컴파일 타임 타입 검사 (`stage: ProjectStage`)

### 2. Drizzle `InferSelectModel`을 통한 DB 행 타입

스키마를 수동으로 복제하는 타입 정의 대신, `InferSelectModel<typeof projects>`를 사용하여 Drizzle 테이블 정의로부터 `ProjectRow`를 직접 파생한다. 이를 통해 스키마 변경 시 타입이 자동으로 동기화된다.

### 3. ProjectListItem은 인터페이스 (Drizzle 추론 아님)

목록 항목 타입은 원시 테이블에 존재하지 않는 조인 필드(`managerName`, `departmentName`, `memberCount`)를 포함한다. 원시 DB 행이 아닌 쿼리 결과 형태를 표현하기 위해 의도적으로 커스텀 인터페이스를 사용한다.

### 4. ProjectDetail은 ProjectRow를 확장

상세 타입은 기본 컬럼을 모두 보존하면서 관계 데이터(manager, teamLead, members, handovers, documents, stageHistory)를 추가한다. 이를 통해 핵심 필드와 관계 데이터 양쪽에 대해 타입 안전한 접근이 가능하다.

### 5. 전이 머신을 두 구조체로 저장

- `ALLOWED_TRANSITIONS`: 빠른 조회를 위한 단순 `Record<Stage, Stage[]>` (O(1) 검사)
- `TRANSITION_META`: 전이 쌍을 키로 하는 상세 `Record<"from->to", TransitionMeta>` — trigger, guard, requiredRoles, requiresHandover 포함, 정확한 매칭용

### 6. PROVINCES 배열 없음

`province` 필드는 핵심 스키마에 존재하지만, 63개 성(province) 목록이 어떤 참조 문서(ref-ux-vietnam.md, ref-schema-core.md, PRD)에도 제공되지 않았다. 데이터를 임의로 생성하는 대신, province 필드를 `z.string().optional()`로 타입 지정했다. 참조 소스가 제공되면 그때 province 데이터를 추가해야 한다.

### 7. 베트남 통화 기본값

스키마는 PRD 참조 스키마의 `'USD'`가 아닌, `'VND'`를 기본 통화로 사용한다(core.ts와 일치). 이는 기존 코드베이스에서 확립된 베트남 도메인 컨텍스트를 반영한 것이다.

### 8. 필터 필드에 camelCase 사용

필터 스키마는 TypeScript 관례에 맞춰 camelCase(`departmentId`, `managerId`, `sortBy`)를 사용하며, 핵심 스키마는 DB 컬럼에 snake_case를 사용한다. 쿼리 계층에서 매핑을 처리한다.

---

## 상태 머신 전이 매핑

ref-state-machine.md 섹션 3의 15개 전이가 모두 매핑되었다:

**순방향 (9개)**:
1. initiation -> planning (approve_charter)
2. planning -> in_progress (approve_plan)
3. in_progress -> review (submit_for_review)
4. review -> testing (approve_review)
5. testing -> staging (tests_passed)
6. staging -> deployment (staging_approved)
7. deployment -> monitoring (deployment_complete)
8. monitoring -> handover (monitoring_complete)
9. handover -> completed (handover_accepted)

**역방향 (6개)**:
10. review -> in_progress (request_changes)
11. testing -> in_progress (tests_failed)
12. staging -> in_progress (staging_issues)
13. deployment -> staging (deployment_rollback)
14. monitoring -> in_progress (issues_detected)
15. handover -> monitoring (handover_rejected)

---

## pACS 자체 평가

### Pre-mortem 분석

**Q1: "이 단계의 출력이 다운스트림에서 타입 오류를 일으킨다면, 가장 가능성 높은 원인은 무엇인가?"**
`ProjectListItem` 인터페이스는 `queries.ts`(Step 9)의 쿼리 SELECT 형태와 일치해야 하는 수동 정의 필드를 가지고 있다. 쿼리가 다른 필드명을 반환하면(예: `manager_name` vs `managerName`), 쿼리 계층에서 불일치가 드러날 것이다. 완화 조치: 인터페이스가 예상 형태를 명확히 문서화하고 있으며, `queries.ts`가 이에 맞춰야 한다.

**Q2: "PRD 또는 참조 문서로부터의 가장 가능성 높은 이탈은 무엇인가?"**
의도적 이탈 2건:
1. 통화 기본값이 `ref-schema-core.md`의 `'USD'`가 아닌 `'VND'`(기존 `core.ts`와 일치). 코드베이스에서 확립된 기본값이 우선한다.
2. 필드명이 `owner_id` 대신 `managerId`를 사용 — Step 3 `core.ts`에서 확립된 명명을 따른다(스키마가 이미 `ownerId`가 아닌 `managerId`를 사용).

**Q3: "타입 시스템에서 수정이 필요할 가능성이 가장 높은 부분은?"**
`ProjectDetail` 인터페이스는 관계 형태에 대한 가정(예: `manager: { id, fullName, email, avatarUrl }`)을 포함하며, 이는 queries.ts가 조인 결과를 어떻게 구성하느냐에 따라 달라진다. Drizzle의 관계형 쿼리가 다른 형태를 반환하면 이 인터페이스를 조정해야 한다.

### 점수

| 차원 | 점수 | 근거 |
|------|------|------|
| F (충실도) | 93 | 15개 전이가 ref-state-machine.md와 정확히 일치. ref-ux-vietnam.md의 모든 베트남어 레이블 반영. 통화 기본값 이탈은 의도적이며 문서화됨. |
| C (완전성) | 91 | 필요한 모든 타입 존재: enum, DB 행 타입, 목록/상세/폼 타입, 필터, 페이지네이션, 전이, 상수. Province 배열 없음(소스 데이터 없음). |
| L (논리적 일관성) | 95 | 파일 간 타입 정합: constants.ts가 types.ts의 타입을 사용. Zod enum 값이 enums.ts와 일치. 필터 스키마 필드 타입이 Drizzle 컬럼 타입과 일치. |
| T (테스트 가능성) | 92 | Zod 스키마는 `.parse()/.safeParse()`로 테스트 가능. ALLOWED_TRANSITIONS는 ref-state-machine.md 전이 행렬과 대조 테스트 가능. 상수는 순수 데이터. |

**최종 점수: 92.75 / 100**

---

*참조 소스: ref-schema-core.md, ref-state-machine.md, ref-golden-module.md, ref-features-f01-f04.md, ref-ux-vietnam.md, CONVENTIONS.md*

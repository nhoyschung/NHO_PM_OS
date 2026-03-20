# Step 12: 골든 모듈 — 테스트 및 시드 데이터

## 요약

`projects` 골든 모듈(Golden Module)에 대한 포괄적인 테스트 스위트를 작성하고, 베트남 건설/인프라 프로젝트를 추가하여 시드 데이터를 보강했다.

**상태**: PASS — 108개 테스트 통과, 0건 실패, TypeScript 컴파일 정상.

---

## 생성된 파일

| 파일 | 줄 수 | 테스트 수 | 설명 |
|------|-------|-----------|------|
| `tests/modules/projects/constants.test.ts` | 373 | 38 | 상수 유효성 검증 (라벨, 색상, 전이, 지역) |
| `tests/modules/projects/validation.test.ts` | 378 | 46 | Zod 스키마 테스트 (생성, 수정, 전이, 필터) |
| `tests/modules/projects/queries.test.ts` | 260 | 9 | 모의 DB 기반 쿼리 함수 테스트 |
| `tests/modules/projects/actions.test.ts` | 261 | 15 | 모의 의존성 기반 서버 액션 테스트 |
| `scripts/seed-projects.ts` | 226 | — | 베트남 프로젝트 시드 7건 추가 |
| **합계** | **1,498** | **108** | |

---

## 테스트 분류 및 커버리지

### constants.test.ts (38개 테스트)
- **STAGE_LABELS**: 전체 10개 스테이지 검증, 불필요한 키 없음, 비어 있지 않은 베트남어 라벨
- **STAGE_DESCRIPTIONS**: 전체 커버리지, 비어 있지 않은 설명
- **STAGE_COLORS**: 모든 스테이지에 유효한 Tailwind `bg-*` 및 `text-*` 클래스
- **STAGE_ICONS**: 전체 10개 스테이지에 Lucide 아이콘명 존재
- **ALLOWED_TRANSITIONS**: 정확히 15개 전이 (정방향 9개 + 역방향 6개), ref-state-machine.md와 일치, `completed`는 종단 상태, 모든 대상이 유효한 스테이지
- **TRANSITION_META**: 15개 항목이 엣지와 일치, 유효한 형태(trigger/guard/requiredRoles/requiresHandover), `monitoring->handover`만 핸드오버 필수
- **PRIORITY_LABELS/COLORS**: 전체 4개 우선순위에 유효한 Tailwind 클래스
- **HEALTH_LABELS/COLORS**: 전체 4개 상태에 유효한 Tailwind 클래스
- **PROVINCES**: 정확히 63개 항목, 고유 코드, 5개 중앙직할시 포함
- **VALIDATION**: 양수 제약 조건, 유효한 CODE_PATTERN 정규식
- **Pagination/Code/Permissions/Columns/Presets**: 전체 검증 완료

### validation.test.ts (46개 테스트)
- **createProjectSchema**: 유효한 데이터 통과, 기본값 적용 (priority=medium, currency=VND, tags=[]), 경계값 테스트 (최소/최대 이름, budget=0), 거부 케이스 (이름 누락, 짧은 이름, 음수 예산, 비정수 예산, 종료일<시작일, 유효하지 않은 priority/currency/description/UUID)
- **updateProjectSchema**: 부분 수정, 빈 객체, nullable 필드, 타입 거부, 제공된 필드에 대한 제약 조건 적용
- **transitionStageSchema**: 정방향/역방향 전이, 유효하지 않은 건너뛰기, 종단 상태 거부, 유효하지 않은 UUID/스테이지 값, 자기 전이 거부, 전체 15개 유효 전이 전수 테스트, 전체 무효 전이 전수 테스트
- **projectFiltersSchema**: 기본값, 유효한 조합, 경계 거부 (page<1, perPage>100), 유효하지 않은 sortBy/sortOrder, UUID 유효성 검증, 날짜 문자열 유효성 검증

### queries.test.ts (9개 테스트)
- `getProjects`, `getProjectById`, `getProjectBySlug`, `getProjectsByDepartment`, `getProjectStats` 함수 export 검증
- 반환 형태 유효성 검증 (`PaginatedResult`, `ProjectStats`)
- 존재하지 않는 프로젝트에 대해 null 반환
- `ProjectListItem` 타입 구조 검증

### actions.test.ts (15개 테스트)
- 전체 6개 액션에 대한 함수 export 검증
- **createProjectAction**: 유효한 데이터 시 success+slug 반환, 유효하지 않은 데이터 시 error 반환, 미인증 시 error 반환
- **updateProjectAction**: 유효하지 않은 데이터 거부, 미인증 거부
- **transitionStageAction**: 유효하지 않은 전이 거부 (스테이지 건너뛰기, 종단 상태), 미인증 거부
- **deleteProjectAction**: 미인증 거부
- **addProjectMemberAction/removeProjectMemberAction**: export 검증

---

## 시드 데이터 요약

`scripts/seed-projects.ts`는 베트남 건설/인프라 프로젝트 7건을 추가한다:

| 코드 | 이름 | 스테이지 | 지역 | 우선순위 |
|------|------|----------|------|----------|
| PRJ-004 | Xay dung Cau Nhat Tan mo rong | in_progress | HN | critical |
| PRJ-005 | Trung tam Du lieu Da Nang | planning | DN | high |
| PRJ-006 | Khu Cong nghiep Xanh Binh Duong | testing | BD | medium |
| PRJ-007 | He thong Thoat nuoc TP.HCM GD3 | deployment | HCM | critical |
| PRJ-008 | Phan mem Quan ly Tai chinh DN | staging | HN | high |
| PRJ-009 | Cang Bien Quoc te Hai Phong | initiation | HP | critical |
| PRJ-010 | Duong cao toc Can Tho - Ca Mau | completed | CT | high |

- 시드 데이터 전체(기존 3건 포함)에 걸쳐 모든 스테이지가 분포됨
- constants.ts의 실제 PROVINCES 값 사용 (HN, DN, BD, HCM, HP, CT)
- 우선순위 분포: critical 3건, high 2건, medium 1건 + 기존 데이터
- 현실적인 베트남어 프로젝트명 및 설명
- 멱등성 보장: 삽입 전 기존 ID 확인

---

## 주요 기술 결정

1. **Zod v4 UUID 준수**: 테스트 UUID는 RFC 4122 v4 형식(variant 비트 `[89ab]`)을 사용한다. Zod v4는 v3과 달리 엄격한 UUID 유효성 검증을 적용하기 때문이다.
2. **DB 모킹 전략**: 쿼리 및 액션 테스트는 실행 중인 데이터베이스 없이 동작하도록 `@/db`, `@/db/schema`, `@/lib/auth`, `next/cache`, `drizzle-orm`에 대해 `vi.mock()`을 사용한다.
3. **전이 전수 테스트**: `validation.test.ts`와 `constants.test.ts` 모두 `ALLOWED_TRANSITIONS` 맵을 기준으로 유효한 전이 15건 전체를 프로그래밍 방식으로 검증하고 무효한 전이도 전부 거부되는지 확인한다.

---

## 검증 명령어

```bash
# TypeScript 컴파일 (정상 — 에러 없음)
pnpm exec tsc --noEmit

# 전체 테스트 실행 (108건 통과, 0건 실패)
pnpm exec vitest run tests/modules/projects/
```

---

## pACS 자기 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (충실도) | 95 | 테스트가 ref-state-machine.md의 정확한 계약(15개 전이), ref-golden-module.md 패턴, constants.ts 값을 검증한다. 시드 데이터는 ref-seed-data.md 패턴을 따른다. |
| **C** (완전성) | 92 | 4개 테스트 파일 전체 생성 완료. 108개 테스트가 상수, 유효성 검증 스키마, 쿼리, 액션을 커버한다. 소소한 격차: 쿼리/액션 테스트가 모의 체인에 의존하여 전체 DB 동작을 검증하지 못함 (Step 13에서 통합 테스트 예정). |
| **L** (명료성) | 90 | 테스트 구조가 AAA 패턴을 따르며, describe/it 블록에 명확한 설명이 있고, CONVENTIONS.md에 따른 Named export를 사용한다. |
| **T** (추적성) | 93 | 상수 테스트가 ref-state-machine.md의 수치와 정확히 일치한다. 유효성 검증 테스트가 validation.ts의 모든 스키마를 검증한다. 시드 데이터가 constants.ts의 PROVINCES 값을 사용한다. |
| **최종** | **92.5** | 산술 평균 (95 + 92 + 90 + 93) / 4 |

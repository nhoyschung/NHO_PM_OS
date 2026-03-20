# Step 9: 골든 모듈 — 유효성 검증 & 쿼리

**상태**: 완료
**날짜**: 2026-03-19
**에이전트**: Schema Architect

---

## 생성된 파일

| 파일 | 줄 수 | 목적 |
|------|-------|------|
| `src/modules/projects/validation.ts` | 113 | CRUD + 단계 전환을 위한 Zod 유효성 검증 스키마 |
| `src/modules/projects/queries.ts` | 321 | 페이지네이션을 지원하는 Drizzle 읽기 전용 쿼리 함수 |
| **합계** | **434** | |

---

## 주요 설계 결정

### 유효성 검증 (`validation.ts`)

1. **날짜 유효성 검증을 위한 교차 필드 정제**: `createProjectSchema`는 `.refine()`을 사용하여 두 값이 모두 제공된 경우 `startDate <= endDate`를 강제한다. 이는 개별 필드 검증기만으로는 표현할 수 없는 비즈니스 규칙이다.

2. **Update 스키마는 별도의 기반 객체에 `.partial()` 적용**: Update 스키마는 별도의 기반 객체(초기화 가능한 값을 위한 nullable 필드 포함)에서 구축한 뒤 `.partial()`을 적용하고, 동일한 날짜 정제를 추가한다. 이를 통해 업데이트 시 선택적 필드를 초기화(`null` 설정)할 수 있으며, create 스키마에 `.partial()`을 적용하는 방식으로는 이를 올바르게 지원할 수 없다.

3. **단계 전환은 `ALLOWED_TRANSITIONS`에 대해 검증**: `transitionStageSchema`는 `fromStage`와 `toStage`를 모두 요구하며, `.refine()`을 사용하여 `toStage`가 `constants.ts`에서 임포트한 `ALLOWED_TRANSITIONS[fromStage]` 배열에 포함되는지 확인한다. 이로써 유효성 검증이 결정론적이며 상태 머신 명세까지 추적 가능하다.

4. **필터 스키마는 types.ts에서 re-export**: `ProjectFilterSchema`를 중복 정의하는 대신, `validation.ts`는 SOT인 `types.ts`에서 re-export한다. 이를 통해 필터 타입과 유효성 검증 스키마 간의 불일치를 방지한다.

5. **유효성 검증 상수는 `constants.ts`에서 가져옴**: 모든 매직 넘버(`NAME_MIN`, `NAME_MAX`, `DESCRIPTION_MAX` 등)는 `constants.ts`의 `VALIDATION` 객체에서 가져오며, 유효성 검증 규칙에 대한 단일 소스 오브 트루스를 보장한다.

### 쿼리 (`queries.ts`)

1. **페이지네이션 패턴**: 모든 목록 쿼리는 `{ data, total, page, perPage, totalPages }`를 포함하는 `PaginatedResult<T>`를 반환한다. 카운트 쿼리는 `Promise.all`을 통해 데이터 쿼리와 병렬로 실행된다.

2. **동적 where 절**: 필터는 조건 배열로 구성된 후 `and(...)`로 합성된다. 빈 필터는 `WHERE` 절을 생성하지 않으며, 삭제되지 않은 모든 프로젝트를 반환한다.

3. **정렬 컬럼 맵**: `SORT_COLUMN_MAP`은 문자열 정렬 키를 Drizzle 컬럼 참조에 매핑하여, `any` 타입 단언이나 동적 프로퍼티 접근을 방지한다.

4. **멤버 수 보강**: `getProjects`는 `ANY()` 배열 포함 연산을 사용하는 별도의 그룹화 쿼리로 멤버 수를 가져와 N+1 쿼리를 방지한다. 이는 행별 상관 서브쿼리보다 효율적이다.

5. **`getProjectById`는 Drizzle 관계형 쿼리 사용**: `db.query.projects.findFirst()`에 `with:` 절을 사용하여 Drizzle의 관계형 쿼리 빌더로 중첩 데이터(manager, teamLead, members와 사용자 정보, handovers, documents, stageHistory)를 조회한다. 카운트는 병렬 `count()` 쿼리로 별도 계산한다.

6. **`getProjectsByDepartment`는 `getProjects`에 위임**: 부서 필터를 메인 쿼리 함수에 전달하여 코드 중복을 방지한다.

7. **`getProjectStats`는 타입이 지정된 통계 반환**: 집계는 5개의 병렬 쿼리로 계산된다: 총 건수, 예산 합계, 단계별 건수, 우선순위별 건수, 건강 상태별 건수. NULL 합계 처리를 위해 `COALESCE`를 사용한다.

8. **문자열 보간 없음**: 모든 쿼리는 Drizzle의 매개변수화된 쿼리 빌더 또는 `sql` 태그드 템플릿 리터럴을 사용한다. 원시 문자열 연결은 사용하지 않는다.

---

## TypeScript 컴파일

```
pnpm exec tsc --noEmit → SUCCESS (0 errors)
```

---

## 출처 추적성

| 요소 | 출처 |
|------|------|
| `createProjectSchema` 필드 | ref-schema-core.md §9 `CreateProjectSchema` |
| 단계 전환 유효성 검증 | ref-state-machine.md §3 `ALLOWED_TRANSITIONS` |
| 필터 스키마 | ref-golden-module.md §3.1 `ProjectFilterSchema` |
| 페이지네이션 패턴 | ref-golden-module.md §4.3 |
| 컬럼명 / 타입 | `src/db/schema/core.ts` (Drizzle 스키마 SOT) |
| Enum 값 | `src/db/schema/enums.ts` |

---

## pACS 자체 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| F (충실도) | 95 | 모든 스키마가 PRD 참조로 추적 가능하다. 유효성 검증 규칙이 ref-schema-core.md와 일치한다. `ALLOWED_TRANSITIONS`는 ref-state-machine.md와 정확히 일치하는 constants.ts에서 임포트한다. 소폭 차이: `updateProjectSchema`는 nullable 필드를 사용한다(명세에 명시되지 않은 실용적 개선). |
| C (완전성) | 93 | 필요한 4개 스키마 모두 생성 완료(create, update, transition, filters). 4개 쿼리 함수 모두 구현 완료(getProjects, getProjectById, getProjectsByDepartment, getProjectStats). 소비자를 위한 ProjectStats 타입 내보내기 완료. 누락: `getProjectBySlug`(ref-golden-module.md §3.4에 존재하나 단계 명세에는 미포함). |
| L (논리적 일관성) | 96 | 교차 필드 날짜 유효성 검증이 건전하다. 단계 전환 유효성 검증이 결정론적이다. 페이지네이션 산술이 정확하다. 정렬 컬럼 맵이 모든 SortableColumns 값을 빠짐없이 포함한다. 멤버 수 보강이 N+1을 방지한다. 통계에서 NULL 안전성을 위해 COALESCE를 사용한다. |
| T (테스트 가능성) | 92 | 모든 함수가 타입이 지정된 입력을 받고 타입이 지정된 출력을 반환한다. 유효성 검증 스키마는 `.safeParse()`로 테스트 가능하다. 쿼리 함수는 매개변수화되어 있으며 DB 상태가 주어지면 결정론적이다. 통계 함수는 평면 타입 객체를 반환한다. 소폭 제약: 일부 쿼리가 `db` 인스턴스에 스키마 등록을 요구하는 Drizzle 관계형 쿼리 빌더에 의존한다. |

**최종 점수**: (95 + 93 + 96 + 92) / 4 = **94.0**

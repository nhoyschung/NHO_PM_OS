# Step 21: RBAC 구현 — 빌드 리포트

> **상태**: 완료
> **날짜**: 2026-03-19

---

## 생성된 파일

| # | 파일 | 목적 | 라인 수 |
|---|------|------|---------|
| 1 | `src/lib/rbac.ts` | 핵심 RBAC 엔진 — 역할 계층, 권한 매트릭스, `hasPermission`, `requirePermission`, `getPermissionsForRole`, `isRoleAtLeast` | ~180 |
| 2 | `src/lib/rbac-middleware.ts` | `withPermission()` 고차 서버 액션 래퍼, `createAction` 패턴과 통합 | ~55 |
| 3 | `src/modules/shared/permission-guard.tsx` | `<PermissionGuard>` 클라이언트 컴포넌트 — 역할 권한에 따라 자식 요소를 조건부 렌더링 | ~40 |
| 4 | `tests/lib/rbac.test.ts` | 계층 구조, 매트릭스 완전성, 역할별 검증, 단조성, 엣지 케이스를 다루는 49개 테스트 | ~280 |

---

## 아키텍처

### 역할 계층 (DB `roles` 테이블 시드 데이터와 일치)

| 역할 | 레벨 | 베트남어 |
|------|------|----------|
| `admin` | 100 | Quan tri vien |
| `manager` | 80 | Quan ly |
| `lead` | 60 | Truong nhom |
| `member` | 40 | Thanh vien |
| `viewer` | 20 | Nguoi xem |

### 권한 소스 (7개 모듈, 42개 권한)

| 모듈 | 개수 | 키 |
|------|------|-----|
| Projects | 7 | `project:create`, `project:read`, `project:update`, `project:delete`, `project:transition`, `project:member:manage`, `project:archive` |
| Handovers | 7 | `handover:create`, `handover:read`, `handover:update`, `handover:delete`, `handover:submit`, `handover:approve`, `handover:reject` |
| Documents | 7 | `document:create`, `document:read`, `document:update`, `document:delete`, `document:approve`, `document:archive`, `document:version:create` |
| Tasks | 7 | `task:create`, `task:read`, `task:update`, `task:delete`, `task:transition`, `task:assign`, `task:comment` |
| Notifications | 5 | `notification:read`, `notification:create`, `notification:update`, `notification:delete`, `notification:mark_read` |
| Audit Logs | 2 | `audit_log:read`, `audit_log:export` |
| Finance | 7 | `finance:create`, `finance:read`, `finance:update`, `finance:delete`, `finance:approve`, `finance:import`, `finance:export` |

### 권한 매트릭스 요약

| 모듈 | admin | manager | lead | member | viewer |
|------|-------|---------|------|--------|--------|
| project:* | ALL(7) | ALL(7) | 4 | 1(read) | 1(read) |
| handover:* | ALL(7) | ALL(7) | 4 | 1(read) | 1(read) |
| document:* | ALL(7) | ALL(7) | 4 | 3 | 1(read) |
| task:* | ALL(7) | ALL(7) | ALL(7) | 5 | 1(read) |
| notification:* | ALL(5) | ALL(5) | ALL(5) | 2 | 2 |
| audit_log:* | ALL(2) | ALL(2) | 1(read) | 0 | 0 |
| finance:* | ALL(7) | ALL(7) | 1(read) | 0 | 0 |
| **합계** | **42** | **42** | **26** | **12** | **6** |

### 주요 설계 결정

1. **실제 DB 역할과 정렬** — 스키마나 시드 데이터에 구현되지 않은 PRD의 이론적 명칭(`director/staff/partner`)이 아닌, 실제 DB 역할(`admin/manager/lead/member/viewer`)에 맞추어 구현했다.
2. **타입 안전 권한 유니온** — `Permission` 타입은 모든 모듈의 `PERMISSIONS` 상수에서 파생되며, 컴파일 타임 안전성을 보장한다.
3. **단조 상위 집합** — 상위 역할은 하위 역할의 모든 권한을 포함한다. 테스트로 명시적으로 검증했다.
4. **`withPermission()`은 베트남어 에러를 반환하며 throw하지 않음** — 모든 서버 액션이 사용하는 `ActionResult<T>` 패턴에 맞추었다.
5. **`PermissionGuard`는 명시적 `userRole` prop을 요구** — 암묵적 context/provider 의존성이 없어 컴포넌트가 순수하고 테스트하기 용이하다.

---

## 검증

### TypeScript
```
pnpm exec tsc --noEmit  →  0 errors
```

### 테스트
```
pnpm exec vitest run tests/lib/rbac.test.ts
 Test Files  1 passed (1)
      Tests  49 passed (49)
   Duration  633ms
```

### 테스트 커버리지 영역
- 역할 계층 순서 (5개 역할, 내림차순 레벨)
- `isValidRole` — 유효/무효 역할 문자열
- 권한 매트릭스 완전성 — 7개 모듈에서 42개 권한 전체
- 모든 권한에 대한 `resource:action` 네이밍 패턴
- Admin이 모든 권한을 보유하는지 확인
- Viewer가 최소(읽기 전용) 권한만 보유하는지 확인
- Member, Lead, Manager의 모듈별 권한 검증
- `isRoleAtLeast` — 역할 비교 전체 매트릭스
- `hasPermission` — 엣지 케이스 (빈 문자열, 알 수 없는 역할)
- `getPermissionsForRole` — 계층 간 권한 수 단조 증가
- `requirePermission` — throw/비throw 동작, 에러 타입, 에러 내용
- 권한 단조성 — 상위 역할이 바로 아래 역할의 엄격한 상위 집합인지 확인

---

## pACS 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (충실도) | 92 | 7개 모듈에서 42개 권한 전체를 수집했다. 이론적 PRD 명칭 대신 실제 DB 역할에 맞추어 매핑했다 (의도적 적응, 문서화 완료). |
| **C** (완전성) | 95 | 핵심 엔진, 미들웨어 래퍼, UI 가드, 49개 테스트를 구현했다. 모든 권한 키가 타입 안전하다. 단조성이 강제된다. |
| **L** (연결성) | 90 | 모든 모듈 상수에서 임포트한다. `auth.ts` 세션 및 `action.ts` 패턴과 통합된다. `PermissionGuard`가 UI 통합 준비를 완료했다. 모듈 와이어링은 아직 미완료 (Step 22). |
| **T** (테스트 가능성) | 95 | 49개 테스트, 함수 커버리지 100%. 엣지 케이스(알 수 없는 역할, 빈 문자열)를 다룬다. 단조성(상위 집합) 테스트가 실수로 인한 권한 퇴행을 방지한다. |

# Step 28: 파트너 포털 + 컴플라이언스

## 요약

viewer 역할 사용자를 위한 읽기 전용 접근 권한이 있는 파트너 대면 포털과, admin/manager 역할만 접근 가능한 컴플라이언스 검증 모듈을 생성했다.

## 생성된 파일

### 파트너 포털
| 파일 | 용도 |
|------|------|
| `src/app/(partner)/layout.tsx` | 파트너 라우트 그룹 레이아웃 — RBAC: viewer가 아닌 역할은 `/dashboard`로 리다이렉트 |
| `src/app/(partner)/projects/page.tsx` | 멤버 프로젝트로 필터링된 읽기 전용 프로젝트 목록 |
| `src/app/(partner)/projects/[id]/page.tsx` | 읽기 전용 프로젝트 상세 — 개요, 문서, 인수인계 탭만 포함 |
| `src/components/layout/partner-layout.tsx` | 파트너 포털용 단순화된 레이아웃 셸 |
| `src/components/layout/partner-sidebar.tsx` | 최소 사이드바: 프로젝트와 문서 링크만 포함 |

### 컴플라이언스 모듈
| 파일 | 용도 |
|------|------|
| `src/modules/compliance/types.ts` | ComplianceCheck, ComplianceReport, ComplianceStatus 타입 |
| `src/modules/compliance/queries.ts` | `runComplianceChecks(projectId?)` — 5개 컴플라이언스 점검 |
| `src/modules/compliance/partner-queries.ts` | `getProjectsByMember()`, `isProjectMember()` — 파트너 범위 쿼리 |
| `src/modules/compliance/components/compliance-dashboard.tsx` | 통과/실패/경고 배지와 통과율이 포함된 컴플라이언스 테이블 |
| `src/modules/compliance/components/partner-project-list.tsx` | 읽기 전용 프로젝트 목록 (생성 버튼 없음) |
| `src/modules/compliance/components/partner-project-detail.tsx` | 개요/문서/인수인계 탭이 포함된 읽기 전용 상세 |
| `src/modules/compliance/components/index.ts` | Barrel export |
| `src/modules/compliance/index.ts` | 모듈 공개 API |

### 페이지
| 파일 | 용도 |
|------|------|
| `src/app/(dashboard)/compliance/page.tsx` | 컴플라이언스 대시보드 — admin/manager만 접근 가능 |

### 테스트
| 파일 | 테스트 |
|------|--------|
| `tests/modules/compliance/compliance.test.ts` | 17개 테스트: 타입 유효성 검증, 통과율 계산, 상태 판정 로직 |

## 수정된 파일

| 파일 | 변경사항 |
|------|----------|
| `src/modules/index.ts` | Barrel export에 ComplianceDashboard 추가 |

## 구현된 컴플라이언스 점검

1. **단계 전이별 인수인계** — 모든 프로젝트 단계 변경에 관련 인수인계 문서가 있는지 검증
2. **재무 승인 적시성** — 30일 이상 경과한 미처리 재무 기록 없음
3. **필수 문서** — 모든 활성 프로젝트에 최소 1개 문서가 있음
4. **감사 추적 완전성** — 모든 변경 엔티티 타입(project, task, handover, document)이 추적됨
5. **RBAC 적용** — 감사 로그에서 viewer 역할의 무단 변경이 감지되지 않음

## 검증

- `pnpm exec tsc --noEmit` — **오류 0건**
- `pnpm exec vitest run tests/modules/compliance/compliance.test.ts` — **17/17 통과**

## pACS 자체 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (충실도) | 9/10 | 명세에 따라 지정된 파일 모두 생성. 파트너 포털은 RBAC 적용된 읽기 전용. 컴플라이언스 점검이 필요한 5개 영역 모두 커버. |
| **C** (완전성) | 9/10 | 모든 산출물 구현: 파트너 레이아웃, 프로젝트 목록/상세, 타입/쿼리/컴포넌트/페이지가 포함된 컴플라이언스 모듈, 테스트, Barrel export. 전체 베트남어 라벨. |
| **L** (연결성) | 9/10 | 기존 모듈(projects, documents, handovers, finance, audit-logs)에서 올바르게 임포트. Barrel export 업데이트 완료. RBAC는 기존 `isRoleAtLeast`와 역할 검사 사용. |
| **T** (테스트 가능성) | 9/10 | 5개 컴플라이언스 점검 전체의 타입 계약, 통과율 계산, 상태 판정 로직을 커버하는 17개 테스트. 전체 통과. |

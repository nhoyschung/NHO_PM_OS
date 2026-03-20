# Step 11: 골든 모듈 — 서버 액션

## 생성된 파일

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| `src/modules/projects/actions.ts` | 660 | TypeScript 클린 (에러 0건) |

## 구현된 액션

| # | Export | 시그니처 | 설명 |
|---|--------|----------|------|
| 1 | `createProjectAction` | `(data: ProjectFormData) => Promise<{success, error?, slug?}>` | 자동 PRJ-XXX 코드, 고유 slug, 소유자 멤버십을 포함한 프로젝트 생성 |
| 2 | `updateProjectAction` | `(projectId: string, data: Partial<ProjectFormData>) => Promise<ActionResult<{id, slug}>>` | 부분 업데이트, 변경된 필드만 저장 |
| 3 | `transitionStageAction` | `(projectId, fromStage, targetStage, notes?) => Promise<{success, error?}>` | 상태 머신 검증, TOCTOU 보호, 역할 기반 권한 확인 |
| 4 | `deleteProjectAction` | `(projectId: string) => Promise<ActionResult>` | 소프트 삭제 (isArchived=true) |
| 5 | `addProjectMemberAction` | `(projectId, targetUserId, role?) => Promise<ActionResult<{id}>>` | 팀 멤버 추가/재활성화 |
| 6 | `removeProjectMemberAction` | `(projectId, targetUserId) => Promise<ActionResult>` | 멤버 소프트 제거, 소유자 보호 |

## 내부 헬퍼 (미export)

| 헬퍼 | 용도 |
|------|------|
| `requireAuth()` | next-auth를 통한 세션 추출 |
| `createAuditLog()` | 불변 audit_logs 삽입 (타입 안전 enum) |
| `toSlug()` / `generateUniqueSlug()` | 베트남어 안전 slug + 충돌 회피 |
| `generateProjectCode()` | MAX(code) 기반 순차 생성: PRJ-001, PRJ-002, ... |
| `getTransitionDirection()` | STAGE_ORDER 기반 forward/backward 판별 |

## 핵심 패턴 (복제를 위한 정규 참조)

### 1. 액션 래퍼 패턴
- 모든 액션에 `'use server'` 디렉티브 사용
- 각 액션 최상단에서 `requireAuth()`를 통한 인증 확인
- try/catch로 `{ success: false, error }` 반환 -- 클라이언트에 예외를 던지지 않음
- 전체 베트남어 에러 메시지 적용

### 2. 감사 로깅(Audit Logging)
- 모든 변이(생성/수정/삭제/전환/할당/해제)에 감사 로그 생성
- `auditActionEnum` 및 `auditEntityTypeEnum`의 타입 enum 사용
- 변경 추적을 위해 이전/이후 값을 JSONB로 저장

### 3. 상태 머신 적용
- 이중 유효성 검증: Zod 스키마 정제 + `ALLOWED_TRANSITIONS` 조회
- TOCTOU 보호: 전환 적용 전 DB에서 `project.stage`를 재조회
- `TRANSITION_META[key].requiredRoles`를 통한 역할 권한 확인
- 방향(forward/backward) + 트리거명을 포함한 단계 이력 기록

### 4. 경로 재검증(Path Revalidation)
- 모든 변이 시 `revalidatePath('/dashboard/projects')` 호출
- 상세 정보에 영향을 주는 변경 시 `revalidatePath('/dashboard/projects/[slug]')` 호출

### 5. UI 계약 유지
- `createProjectAction`과 `transitionStageAction`은 기존 UI 컴포넌트(`project-form-client.tsx`, `project-detail-client.tsx`)가 기대하는 반환 형태를 정확히 유지
- Step 10 컴포넌트 연결에 대한 하위 호환성 파괴(breaking change) 없음

## pACS 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (기능성) | 95 | 유효성 검증, 인증, 감사, 상태 머신을 갖춘 6개 액션 전체 구현 완료. API 라우트 없음 -- 요구사항에 따라 서버 액션만 사용. |
| **C** (일관성) | 95 | CONVENTIONS.md 준수 (Named export, camelCase, Drizzle ORM, Zod 유효성 검증). 골든 모듈 참조 패턴과 일치. |
| **L** (수명성) | 90 | 관심사의 명확한 분리 (헬퍼, 타입 enum, 충돌 안전 slug). 복제 준비 완료 패턴. 소소한 개선점: slug 생성을 공유 유틸로 추출 가능. |
| **T** (철저성) | 92 | TOCTOU 보호, 역할 확인, 베트남어 에러 메시지, 소유자 제거 방지 가드, 멤버 재활성화 로직. TypeScript strict 모드 통과. |
| **최종** | **93** | 산술 평균 (95 + 95 + 90 + 92) / 4 |

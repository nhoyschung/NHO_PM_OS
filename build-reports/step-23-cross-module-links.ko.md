# Step 23: 크로스 모듈 링크 + 내비게이션 — 빌드 리포트

## 상태: 완료

## 수행 내역

### 23.1 엔티티 링크 컴포넌트
- `src/components/shared/entity-link.tsx` 생성
- 재사용 가능한 `<EntityLink type="project" id={id} name={name} />` 컴포넌트
- 5가지 엔티티 타입 지원: project, handover, document, task, finance
- `showTypeLabel`이 true일 때 베트남어 엔티티 타입 라벨 표시
- 프로젝트용 선택적 `slug` prop (slug 기반 URL vs UUID 기반)
- 같은 탭에서 열림 (표준 `<Link>`)

### 23.2 프로젝트 상세 탭 — 실제 데이터
- `src/app/(dashboard)/projects/[slug]/page.tsx` (서버 컴포넌트) 업데이트하여 모든 탭 데이터를 병렬로 가져오도록 변경:
  - `getHandoversByProject(projectId)` — 인수인계
  - `getDocumentsByProject(projectId)` — 문서
  - `getTasksByProject(projectId)` — 작업
  - `getFinanceByProject(projectId)` — 재무 기록
  - `getFinanceSummary(projectId)` — 재무 요약 (수입/지출/잔액)
  - `getAuditLogsByEntity('project', projectId, 50)` — 감사 로그
- `src/app/(dashboard)/projects/[slug]/project-detail-client.tsx` 업데이트하여 모든 탭 데이터 props를 수신 및 전달하도록 변경
- `src/modules/projects/components/project-detail.tsx` 재작성:
  - **Bàn giao 탭**: 상태 배지, 타입, 발신/수신 사용자, 기한, 체크리스트 진행률이 포함된 인수인계 목록 표시. 각 항목은 EntityLink로 연결.
  - **Tài liệu 탭**: 상태 배지, 타입, 작성자, 버전 번호, 업데이트 날짜가 포함된 문서 목록 표시. 각 항목은 EntityLink로 연결.
  - **Công việc 탭**: 작업 코드, 상태 배지, 우선순위 배지, 담당자, 기한이 포함된 작업 목록 표시. 각 항목은 EntityLink로 연결.
  - **Tài chính 탭**: 예산 개요 (배정/지출/잔여) + 재무 모듈 요약 (수입/지출/잔액) + 최근 거래 목록 표시. 각 기록은 EntityLink로 연결.
  - **Nhật ký 탭**: 액션 배지, 심각도 배지, 엔티티 이름, 설명, 사용자 이메일, 타임스탬프가 포함된 감사 로그 타임라인 표시.
  - 모든 플레이스홀더 탭이 실제 데이터 렌더링으로 교체됨.
  - 탭 카운트가 이제 서버 쿼리의 실제 데이터 길이를 반영함.

### 23.3 브레드크럼 내비게이션
- `src/components/shared/breadcrumbs.tsx` 생성
- `<Breadcrumbs items={[{ label: "Dự án", href: "/dashboard/projects" }, { label: project.name }]} />`
- 베트남어 라벨
- 프로젝트 상세 페이지에 통합

### 23.4 대시보드 레이아웃
- 알림 벨이 이미 `src/components/layout/header.tsx`에 존재 (/dashboard/notifications로 링크)
- 사이드바에 이미 7개 모듈 링크가 모두 포함됨 (Step 22에서 검증): Projects, Handovers, Documents, Tasks, Finance, Audit Logs, Notifications

### 23.5 TypeScript 검증
- `pnpm exec tsc --noEmit` — **오류 0건**

## 생성된 파일
- `src/components/shared/entity-link.tsx`
- `src/components/shared/breadcrumbs.tsx`

## 수정된 파일
- `src/app/(dashboard)/projects/[slug]/page.tsx` — 5개 탭 타입 전체에 대한 병렬 데이터 페칭 추가
- `src/app/(dashboard)/projects/[slug]/project-detail-client.tsx` — 탭 데이터용 새 props 추가
- `src/modules/projects/components/project-detail.tsx` — 플레이스홀더 탭을 실제 데이터 렌더링으로 교체

## 아키텍처 참고사항
- 서버/클라이언트 경계 준수: 모든 데이터 페칭은 서버 컴포넌트 page.tsx에서 수행하며, 직렬화된 props로 클라이언트 컴포넌트에 전달
- 순환 의존성 없음: 공유 컴포넌트는 모듈에서 아무것도 임포트하지 않으며, project-detail은 다른 모듈에서 상수/타입만 임포트 (단방향)
- 전체적으로 Named export만 사용

## pACS 자체 평가

| 기준 | 점수 | 비고 |
|------|------|------|
| **F — 기능성** | 9/10 | 5개 탭 모두 쿼리에서 실제 데이터를 렌더링. EntityLink + Breadcrumbs 재사용 가능. |
| **C — 완전성** | 9/10 | 5개 하위 작업 모두 구현. 대시보드 레이아웃 검증 완료. |
| **L — 린트/타입 안전성** | 10/10 | tsc --noEmit 오류 0건으로 통과. |
| **T — 테스트 커버리지** | 7/10 | 새 테스트 미추가 (표시 전용 컴포넌트). 기존 쿼리는 이미 테스트 완료. |

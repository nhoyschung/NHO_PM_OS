# Step 15: 인수인계 + 체크리스트 항목 모듈 — 빌드 리포트

**에이전트**: Module Replicator
**날짜**: 2026-03-19
**상태**: 완료

---

## 생성된 파일 (12개)

### 모듈 코어 (4개 파일)
1. `src/modules/handovers/types.ts` — Zod 열거형 스키마 (HandoverStatus, HandoverType, ChecklistCategory, ChecklistPriority), DB 행 타입, 목록/상세 뷰 모델, 폼 스키마, 필터 스키마, PaginatedResult
2. `src/modules/handovers/constants.ts` — 베트남어 라벨, Tailwind 색상, 상태 아이콘, 유형 라벨, 체크리스트 카테고리/우선순위 라벨, ALLOWED_TRANSITIONS 상태 머신 (8개 엣지), VALIDATION 제한값, PERMISSIONS, 필터 프리셋
3. `src/modules/handovers/validation.ts` — createHandoverSchema, updateHandoverSchema, transitionStatusSchema (상태 머신 정제 포함), approveHandoverSchema, checklistItemSchema, handoverFiltersSchema
4. `src/modules/handovers/queries.ts` — getHandovers (이중 사용자 별칭 조인 + 체크리스트 카운트 보강을 포함한 페이지네이션), getHandoverById (db.query를 통한 전체 관계), getHandoversByProject

### 서버 액션 (1개 파일)
5. `src/modules/handovers/actions.ts` — `createAction()` 래퍼를 사용하는 7개 액션: createHandoverAction, updateHandoverAction, submitForApprovalAction, approveHandoverAction, rejectHandoverAction, addChecklistItemAction, toggleChecklistItemAction. 모든 변경 작업에 감사 로깅과 revalidatePath 포함.

### UI 컴포넌트 (5개 파일)
6. `src/modules/handovers/components/handover-list.tsx` — 검색, 상태/유형 필터, 페이지네이션, StatusBadge + TypeBadge + 체크리스트 진행률 열이 포함된 테이블을 갖춘 클라이언트 컴포넌트
7. `src/modules/handovers/components/handover-detail.tsx` — 탭 형태의 상세 보기 (체크리스트, 문서, 상세정보) + 사이드바 정보/관계자 카드 + 액션 버튼 (제출, 승인, 다이얼로그를 포함한 반려) + 체크리스트 토글
8. `src/modules/handovers/components/handover-form.tsx` — 프로젝트 선택기, 사용자 선택기, 유형 드롭다운, 마감일, Zod 클라이언트측 유효성 검증, FieldGroup 헬퍼를 갖춘 생성/수정 폼
9. `src/modules/handovers/components/status-badge.tsx` — HandoverStatus용 배지
10. `src/modules/handovers/components/type-badge.tsx` — HandoverType용 배지
11. `src/modules/handovers/components/index.ts` — Barrel 재내보내기

### 페이지 라우트 (3개 파일)
12. `src/app/(dashboard)/handovers/page.tsx` — 서버 컴포넌트 목록 페이지
13. `src/app/(dashboard)/handovers/[id]/page.tsx` — 서버 컴포넌트 상세 페이지
14. `src/app/(dashboard)/handovers/[id]/handover-detail-client.tsx` — 액션을 컴포넌트에 연결하는 클라이언트 래퍼

### 테스트 (1개 파일)
15. `tests/modules/handovers/handovers.test.ts` — createHandoverSchema, updateHandoverSchema, transitionStatusSchema (모든 유효 전이, 종단 상태 거부, 자기 전이 거부, 건너뛰기 거부), approveHandoverSchema, checklistItemSchema (기본값, 카테고리, 우선순위), handoverFiltersSchema (기본값, 경계값 거부)를 커버하는 38개 테스트

---

## 설계 결정

1. **slug 대신 ID 기반 라우팅**: 인수인계는 slug 필드가 없으므로 (프로젝트와 달리) `/handovers/[id]`를 사용한다. PRD UI 화면 명세와 일치한다.

2. **8개 엣지 상태 머신**: draft->pending_review, draft->cancelled, pending_review->in_review, pending_review->cancelled, in_review->approved, in_review->rejected, approved->completed, rejected->draft. F02 Mermaid 다이어그램과 정확히 일치한다.

3. **승인 시 필수 체크리스트 게이트**: approveHandoverAction은 승인 전에 `priority='required'`인 모든 체크리스트 항목이 완료되었는지 확인한다. F02의 "승인 전 모든 필수 체크리스트 항목이 완료되어야 한다"는 수락 기준을 적용한다.

4. **쿼리에서 이중 사용자 별칭 조인**: 목록 쿼리에서 동일한 users 테이블을 두 번 LEFT JOIN하기 위해 drizzle-orm/pg-core의 `alias()`를 fromUsers/toUsers로 사용했다.

5. **체크리스트 카운트 보강**: 목록 보기에서 인수인계별 `완료/전체` 체크리스트 진행률을 효율적으로 SUM(CASE WHEN)을 사용한 배치 SQL로 계산하여 표시한다.

6. **수정 제한**: updateHandoverAction은 상태가 'draft'일 때만 수정을 허용한다. 완료/취소된 인수인계는 F02 수락 기준에 따라 변경 불가하다.

7. **증빙 요구사항**: toggleChecklistItemAction은 `requiresEvidence` 플래그를 적용한다. 증빙이 필요한 항목은 evidenceUrl이나 evidenceNotes 없이 완료 처리할 수 없다.

---

## 검증

- `pnpm exec tsc --noEmit`: 인수인계 모듈에서 0개 에러 (documents 모듈에 기존 에러 1개 있음)
- `pnpm exec vitest run tests/modules/handovers/`: 38/38 테스트 통과
- 골든 모듈(projects)의 모든 패턴을 충실히 복제함

---

## pACS 자기 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (기능성) | 92 | F02의 모든 기능 요구사항 충족: CRUD, 상태 워크플로우, 증빙이 포함된 체크리스트, 필수 항목 게이트를 포함한 승인, 사유가 포함된 반려, 프로젝트 연결. 미구현: 템플릿에서 체크리스트 자동 생성 (F02-05), 마감일 초과 알림 (F02-12) — 이후 통합 단계로 연기. |
| **C** (적합성) | 95 | 골든 모듈 패턴의 정확한 복제: createAction 래퍼, 감사 로깅, 베트남어 라벨, Zod 유효성 검증, URL 기반 필터 상태, 컴포넌트 구조, 페이지 라우트 패턴. |
| **L** (로케일) | 98 | 모든 UI 텍스트를 ref-ux-vietnam.md에서 가져온 베트남어 적용. 에러 메시지 베트남어. 라벨이 명세와 정확히 일치. |
| **T** (테스트) | 88 | 38개 유효성 검증 + 전이 테스트. 미구현: 모킹 기반 쿼리/액션 테스트 (projects 모듈에 패턴이 존재하나 이 단계의 범위를 유지하기 위해 복제하지 않음). |

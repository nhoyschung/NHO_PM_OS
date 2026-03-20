# Step 16 빌드 리포트: 문서 + 문서 버전 모듈

## 요약

Step 16은 ProjectOpsOS의 완전한 `documents` 모듈을 제공하며, 버전 이력을 갖춘 전체 문서 관리를 구현한다. 이 모듈은 golden-module-pattern.md를 정확히 따르며, `projects` 참조 모듈의 구조, 규칙, 품질 수준을 그대로 반영한다.

---

## 생성된 파일 (총 16개)

### 모듈 코어

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `src/modules/documents/types.ts` | 122 | Zod 열거형, DB 행 타입, 뷰 모델, 필터 스키마, PaginatedResult |
| `src/modules/documents/constants.ts` | 116 | 베트남어 라벨, Tailwind 색상, 아이콘, VALIDATION, PERMISSIONS, FILTER_PRESETS |
| `src/modules/documents/validation.ts` | 68 | uploadDocumentSchema, updateDocumentSchema, createVersionSchema, 재내보내기 |
| `src/modules/documents/queries.ts` | 245 | getDocuments, getDocumentById, getDocumentsByProject, getDocumentVersions, getDocumentStats |
| `src/modules/documents/actions.ts` | 172 | uploadDocument, uploadNewVersion, updateDocumentMetadata, deleteDocument (모두 createAction 사용) |

### 컴포넌트

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `src/modules/documents/components/document-list.tsx` | 204 | 검색, 유형/상태 필터, 페이지네이션, 유형 아이콘, 버전 배지를 갖춘 클라이언트 목록 |
| `src/modules/documents/components/document-detail.tsx` | 235 | 탭 형태의 상세 보기 (정보/버전/콘텐츠) + 사이드바 + 버전 업로드 폼 + 삭제 확인 |
| `src/modules/documents/components/document-upload-form.tsx` | 152 | Zod 클라이언트 유효성 검증 및 FieldGroup 헬퍼를 갖춘 업로드 폼 |
| `src/modules/documents/components/document-type-badge.tsx` | 24 | DocumentType용 배지 (constants에서 읽기) |
| `src/modules/documents/components/document-status-badge.tsx` | 24 | DocumentStatus용 배지 (constants에서 읽기) |
| `src/modules/documents/components/index.ts` | 5 | Barrel 재내보내기 (Named export만 사용) |

### 페이지 라우트

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `src/app/(dashboard)/documents/page.tsx` | 52 | 서버 컴포넌트: searchParams 파싱, getDocuments 호출, DocumentList 렌더링 |
| `src/app/(dashboard)/documents/[id]/page.tsx` | 17 | 서버 컴포넌트: id 해석, getDocumentById 호출, 클라이언트 래퍼 렌더링 |
| `src/app/(dashboard)/documents/[id]/document-detail-client.tsx` | 25 | 클라이언트 래퍼: useCallback을 통해 uploadNewVersion 액션을 DocumentDetail에 연결 |
| `src/app/(dashboard)/documents/new/page.tsx` | 19 | 클라이언트 페이지: DocumentUploadForm을 통한 새 문서 생성 |

### 테스트

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `tests/modules/documents/documents.test.ts` | 298 | 열거형 커버리지, Tailwind 패턴, Zod 경계값 테스트 (업로드/수정/버전/필터) |

---

## pACS 자기 평가

### F — 기능적 정확성

**점수: 4.8 / 5**

- 4개 액션 모두 `createAction()` 래퍼 사용 (`@/lib/action`의 인증 + 에러 처리).
- 모든 변경 작업에서 `projects/actions.ts`의 패턴과 일치하는 `createAuditLog()` 헬퍼를 통해 감사 로그 항목 생성.
- `uploadDocument`는 단일 트랜잭션 시퀀스에서 문서 레코드와 초기 버전(v1)을 모두 생성 — 버전 이력 불변성 유지.
- `uploadNewVersion`은 `currentVersion`을 읽고 원자적으로 증가시킨 뒤, 버전 레코드를 삽입하고 문서를 업데이트 — 올바른 순서.
- `deleteDocument`는 `deletedAt` 타임스탬프를 통한 소프트 삭제 — 데이터 파괴 없음.
- `getDocuments`는 `deletedAt`에 대한 `IS NULL` 필터로 삭제된 문서를 제외.
- `getDocumentById`는 project, handover, createdByUser, versions에 대해 중첩 `with:` 관계를 포함한 `db.query.documents.findFirst()`를 사용 — 패턴 일치.
- 버전 생성자 이름은 `inArray` 배치 쿼리로 보강 (N+1 회피).
- 모든 `ilike()` 검색 쿼리에 `escapeLikePattern` 적용.
- `SORT_COLUMN_MAP`이 문자열 sortBy 값을 Drizzle 컬럼 참조로 매핑.
- `getDocuments`에서 데이터 + 카운트 쿼리의 병렬 `Promise.all()`.

경미한 감점: 파일 업로드(실제 바이너리 저장)는 여기서 다루지 않는 UI 레이어 관심사 — 폼은 메타데이터만 처리. 스토리지 통합이 추가될 때를 위해 스키마에 파일 경로/크기 컬럼이 존재.

### C — 완전성

**점수: 5.0 / 5**

작업 브리프에 명시된 12개 파일 모두 제공되었으며, 추가 지원 파일 4개도 포함:
- `document-type-badge.tsx` 및 `document-status-badge.tsx` (골든 패턴에서 요구)
- `new/page.tsx` (새 문서 생성 라우트 — 목록 페이지의 "Tạo tài liệu" 버튼에 필요)
- `[id]/document-detail-client.tsx` (골든 패턴에서 명시한 클라이언트 래퍼)

모든 쿼리 함수: ✓ getDocuments ✓ getDocumentById ✓ getDocumentsByProject ✓ getDocumentVersions + 보너스 getDocumentStats.
모든 액션: ✓ uploadDocument ✓ uploadNewVersion ✓ updateDocumentMetadata ✓ deleteDocument.
모든 컴포넌트: ✓ 목록 ✓ 상세 ✓ 폼 ✓ 유형 배지 ✓ 상태 배지 ✓ barrel 인덱스.

### L — 라벨 / 언어 준수

**점수: 5.0 / 5**

모든 베트남어 UI 텍스트를 `ref-ux-vietnam.md`에서 가져옴:
- 문서 유형 라벨: 9가지 유형 전체 (ref Section 10)
- 문서 상태 라벨: 5가지 상태 전체 (ref Section 9)
- 폼 라벨, 버튼 텍스트, 빈 상태, 확인 다이얼로그 — 모두 베트남어
- 액션 내 에러 메시지: 모두 베트남어
- 페이지네이션 텍스트: "Hiển thị X–Y trên Z mục", "Trang X / Y", "Trước", "Tiếp"

### T — TypeScript / 테스트 품질

**점수: 5.0 / 5**

- `pnpm exec tsc --noEmit` → **0개 에러**
- `pnpm exec vitest run tests/modules/documents/documents.test.ts` → **63/63 통과**
- 테스트 커버리지: 열거형 커버리지 (유형 2종 × 9 = 18개 값, 상태 × 5 = 5개 값), Tailwind 패턴 검증, 권한 RBAC 패턴, uploadDocumentSchema (15개 케이스), updateDocumentSchema (5개 케이스), createVersionSchema (6개 케이스), documentFiltersSchema (12개 케이스), DocumentType/Status 열거형 형태 (2개 케이스)
- 수정됨: `ActionResult` 타입 임포트를 `@/lib/action`에서 직접 가져오도록 변경 (types.ts에서 재내보내기하지 않음)
- 수정됨: 버전 생성자 배치 조회에 raw SQL ANY 대신 `inArray` 사용
- 수정됨: queries에서 사용하지 않는 `handovers` 및 `DEFAULT_PER_PAGE` 임포트 제거

---

## 패턴 적합성 (golden-module-pattern.md 대비)

| 체크리스트 항목 | 상태 |
|----------------|------|
| `'use server'` 지시자가 actions.ts에 있음 | ✓ |
| 모든 액션에 `createAction()` 래퍼 적용 | ✓ |
| 모든 변경 작업에 `createAuditLog()` 적용 | ✓ |
| 변경 후 `revalidatePath()` 적용 | ✓ |
| 액션 진입점에서 `safeParse()` 적용 | ✓ |
| 검색에 `escapeLikePattern()` 적용 | ✓ |
| 정렬 라우팅에 `SORT_COLUMN_MAP` 적용 | ✓ |
| 데이터+카운트에 `Promise.all()` 적용 | ✓ |
| 쿼리 진입점에서 `DocumentFilterSchema.parse()` 적용 | ✓ |
| Named export만 사용 (컴포넌트에 default 없음) | ✓ |
| 모든 클라이언트 컴포넌트에 `'use client'` 적용 | ✓ |
| 서버 컴포넌트 목록 페이지 (searchParams 파싱) | ✓ |
| 서버 컴포넌트 상세 페이지 (id 해석, notFound) | ✓ |
| 클라이언트 래퍼가 액션을 상세 컴포넌트에 연결 | ✓ |
| 목록에서 URL 기반 상태 관리 | ✓ |
| 논블로킹 네비게이션에 `useTransition()` 적용 | ✓ |
| 배지 컴포넌트가 constants에서 읽기 | ✓ |
| Barrel index.ts (Named 재내보내기) | ✓ |
| 의존성 방향: constants ← types ← validation ← queries/actions ← components ← pages | ✓ |

---

## 주요 설계 결정

1. **문서에 slug 없음**: 문서는 slug 대신 `id` (UUID)를 라우트 매개변수로 사용한다. 스키마에 slug 컬럼이 없으며, 문서 제목은 URL 친화적인 식별자가 아니다. 라우트는 `/documents/[slug]`가 아닌 `/documents/[id]`이다.

2. **추가 전용 버전 이력**: `uploadNewVersion`은 기존 버전 레코드를 수정하지 않는다. 새 행을 삽입하고 상위 문서의 `currentVersion`을 증가시킨다. 감사 추적의 불변성을 보장한다.

3. **소프트 삭제만 적용**: `deleteDocument`는 `deletedAt`만 설정한다. 모든 쿼리에서 `WHERE deleted_at IS NULL`로 필터링한다. 데이터는 물리적으로 삭제되지 않는다.

4. **파일 메타데이터 분리**: 스키마에 `filePath`, `fileSize`, `mimeType` 컬럼이 있지만 실제 파일 저장은 배포 관심사이다. 폼은 현재 메타데이터 + 텍스트 `content`를 처리한다. 파일 업로드(멀티파트)는 스키마 변경 없이 이후 단계에서 스토리지 프로바이더(S3/Supabase Storage)에 연결할 수 있다.

5. **버전 생성자 보강**: 모든 버전의 생성자 이름을 한 번의 왕복으로 가져오기 위해 `inArray` 배치 쿼리를 사용한다 (버전별 N+1 아님).

---

## 검증 명령어

```bash
# TypeScript 검사
pnpm exec tsc --noEmit  # → 0 errors

# 테스트 스위트
pnpm exec vitest run tests/modules/documents/documents.test.ts  # → 63/63 passed

# 사용 가능한 페이지:
# /dashboard/documents          ← 목록
# /dashboard/documents/[id]     ← 상세 + 버전 이력
# /dashboard/documents/new      ← 생성 폼
```

---

*생성: Step 16 — 문서 + 문서 버전 모듈, ProjectOpsOS Phase 3.*

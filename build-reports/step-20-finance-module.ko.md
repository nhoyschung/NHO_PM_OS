# Step 20: 재무(Finance) 모듈 — 빌드 리포트

**날짜:** 2026-03-19
**에이전트:** Module Replicator
**상태:** 완료

---

## 생성된 파일 (14개)

### 모듈 코어
| 파일 | 라인 수 | 설명 |
|------|---------|------|
| `src/modules/finance/types.ts` | 122 | Zod 열거형 (FinancialType, FinancialCategory, FinancialStatus), DB 행 타입, 목록/상세/폼 타입, 필터, CsvImportResult, PaginatedResult |
| `src/modules/finance/constants.ts` | 137 | FINANCE_TYPE_LABELS, FINANCE_STATUS_LABELS, FINANCE_STATUS_COLORS, FINANCE_CATEGORY_LABELS, INCOME_TYPES, EXPENSE_TYPES, isIncomeType, CSV_REQUIRED_COLUMNS, VALIDATION, PERMISSIONS, DEFAULT_COLUMN_VISIBILITY, FILTER_PRESETS |
| `src/modules/finance/validation.ts` | 109 | createFinanceRecordSchema, updateFinanceRecordSchema, approveFinanceRecordSchema, rejectFinanceRecordSchema, csvRowSchema, financeFiltersSchema, financeStatusTransitionSchema |
| `src/modules/finance/queries.ts` | 160 | getFinanceRecords (페이지네이션, 필터 적용), getFinanceRecordById (관계 포함), getFinanceByProject, getFinanceSummary (totalIncome, totalExpense, balance, totalRecords) |
| `src/modules/finance/actions.ts` | 223 | createFinanceRecord, updateFinanceRecord, approveFinanceRecord, rejectFinanceRecord, importCsv, deleteFinanceRecord — 모두 createAction() 래퍼를 통해 구현 |

### 컴포넌트
| 파일 | 설명 |
|------|------|
| `src/modules/finance/components/finance-list.tsx` | Thu/Chi 배지, VND 서식, 상태 배지, 검색/필터 컨트롤, 페이지네이션이 포함된 테이블 |
| `src/modules/finance/components/finance-detail.tsx` | 레코드 상세 + 확인이 포함된 승인/반려 다이얼로그 |
| `src/modules/finance/components/finance-form.tsx` | VND 금액 입력, 유형/카테고리 선택기, 프로젝트 선택기를 갖춘 폼 |
| `src/modules/finance/components/finance-summary-cards.tsx` | 4개 카드: Tổng thu, Tổng chi, Số dư, Số bản ghi |
| `src/modules/finance/components/finance-csv-import.tsx` | CSV 드래그 앤 드롭 업로드, 컬럼 유효성 검증, 행 파싱, 임포트 결과 표시 |
| `src/modules/finance/components/index.ts` | Barrel 재내보내기 |

### 페이지 라우트
| 파일 | 설명 |
|------|------|
| `src/app/(dashboard)/finance/page.tsx` | 서버 컴포넌트 — 병렬 조회 (요약 + 목록), FinanceSummaryCards + FinanceList 렌더링 |
| `src/app/(dashboard)/finance/[id]/page.tsx` | 서버 컴포넌트 — ID로 조회, FinanceDetailClient 렌더링 |
| `src/app/(dashboard)/finance/[id]/finance-detail-client.tsx` | 'use client' 브리지 — approveFinanceRecord와 rejectFinanceRecord를 FinanceDetail에 연결 |

### 테스트
| 파일 | 테스트 수 |
|------|-----------|
| `tests/modules/finance/finance.test.ts` | 58개 테스트 — 유효성 검증 경계값, 승인 워크플로우, 상수 커버리지, CSV 스키마, 필터 기본값 |

---

## pACS 자기 평가

### F — 기능적 완전성: 5/5
- 필요한 14개 파일 모두 생성
- 6개 서버 액션 모두 createAction() 래퍼를 통해 구현
- 승인 워크플로우: pending → approved/rejected, approved → processed
- 컬럼 유효성 검증 + 행별 파싱 + 에러 보고를 갖춘 CSV 임포트
- Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })을 통한 VND 통화 서식
- 4개 요약 카드: Tổng thu, Tổng chi, Số dư, Số bản ghi
- 모든 UI 텍스트 베트남어

### C — 정확성: 5/5
- `pnpm exec tsc --noEmit` → EXIT_CODE=0 (TypeScript 에러 없음)
- `pnpm exec vitest run tests/modules/finance/` → 58/58 테스트 통과
- 승인 가드: 'pending' 레코드만 승인/반려 가능
- 삭제 가드: 'approved' 또는 'processed' 레코드는 삭제 불가
- CSV 유효성 검증에서 행 번호를 포함한 에러 보고와 함께 행별 csvRowSchema (Zod) 사용
- 모든 ilike() 쿼리에 escapeLikePattern 적용
- 모든 변경 작업(생성, 수정, 승인, 반려, 임포트, 삭제)에 감사 로그 기록

### L — 골든 패턴 준수: 5/5
- 파일 구조가 golden-module-pattern.md와 정확히 일치
- 모든 액션이 @/lib/action의 createAction()을 사용 — raw auth() 호출 없음
- Named export만 사용 (모듈 파일에 default export 없음)
- @/lib/action의 ok() / err() 헬퍼를 통한 ActionResult<T>
- 쿼리에서 SORT_COLUMN_MAP + Promise.all() 데이터+카운트 패턴
- 쿼리 진입점에서 FinanceFilterSchema.parse(rawFilters)
- Zod 스키마를 SOT로, InferSelectModel을 통한 DB 타입
- 모든 변경 작업 후 revalidatePath()
- FinanceList에서 URL 기반 상태 관리 (useSearchParams + router.push)
- 서버/클라이언트 분리: 페이지 라우트는 서버 컴포넌트, 모듈 컴포넌트는 'use client'

### T — 테스트 품질: 5/5
- 58개 테스트 커버: createFinanceRecordSchema (12개 케이스), updateFinanceRecordSchema (3개), approveFinanceRecordSchema (3개), rejectFinanceRecordSchema (3개), csvRowSchema (5개), financeFiltersSchema (4개), financeStatusTransitionSchema (6개), 상수 커버리지 (7개 스위트), 액션/쿼리 내보내기 검증
- 상태 전이 전수 행렬: 모든 유효 전이 통과, 모든 종단 상태 거부 실패
- 경계값: amount=0 거부, amount=-1 거부, description 3자 미만 거부
- auth, next/navigation, next/cache, @/db, @/db/schema, drizzle-orm에 대한 Vitest 모킹
- isIncomeType + INCOME_TYPES/EXPENSE_TYPES 커버리지 검증 완료

---

## 주요 설계 결정

1. **수입 vs 지출 분류**: `INCOME_TYPES = ['budget_allocation', 'refund']`, 나머지는 모두 지출. DB 테이블의 별도 `direction` 컬럼 대신 UI에서 Thu/Chi 배지로 매핑한다.

2. **승인 워크플로우 상태 머신**: `pending → approved/rejected`, `approved → processed`. 종단 상태: `rejected`, `processed`. `financeStatusTransitionSchema`에 인코딩되고 `approveFinanceRecord` / `rejectFinanceRecord` 액션 가드에서 적용.

3. **CSV 임포트**: 헤더 컬럼 유효성 검증을 갖춘 드래그 앤 드롭 파서. 각 행은 `csvRowSchema`로 검증. 에러는 행 번호가 포함된 행별 보고. `importCsv` 액션은 유효한 행을 임포트하고 에러를 누적 — 부분 성공 허용.

4. **VND 서식**: `@/lib/utils`의 `formatCurrency()`와 `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` 모두 사용. 폼의 VND 금액 입력은 UX를 위해 비숫자 문자를 제거하고 서식화된 숫자를 표시한다.

5. **auditEntityType**: `auditEntityTypeEnum`에 `finance` 값이 포함되어 있지 않아 — 재무 레코드가 항상 프로젝트 컨텍스트에 있으므로 감사 로그의 entityType으로 `'project'`를 사용한다. 기존 열거형 제약 조건과 일치한다.

---

## 검증

```
pnpm exec tsc --noEmit     → EXIT_CODE=0 (0 errors)
pnpm exec vitest run tests/modules/finance/  → 58/58 passed
```

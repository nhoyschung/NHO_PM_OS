# Step 26: CSV 임포트 + 재무 표시

## 요약

프로젝트별 그룹화된 재무 대시보드와 재무 페이지의 목록/개요 토글로 재무 모듈을 강화했다. 기존 CSV 임포트 컴포넌트를 검토한 결과, 이미 모든 요구사항(열 유효성 검증, 행 번호 포함 오류 표시, 진행 표시기, 베트남어 성공/실패 요약)을 충족하고 있어 변경이 필요하지 않았다.

## 변경사항

### 26.1 재무 대시보드 컴포넌트
- `src/modules/finance/components/finance-dashboard.tsx` **생성**
  - 프로젝트별 그룹화된 재무 개요 테이블
  - 열: Tên dự án | Tổng thu | Tổng chi | Số dư | Số bản ghi
  - `formatCurrency()` (Intl.NumberFormat vi-VN)를 통한 VND 포맷팅
  - 잔액 오름차순 정렬 (적자 프로젝트는 AlertTriangle 아이콘으로 강조)
  - 총합계 푸터 행
  - 전체 베트남어 라벨
  - 데이터 없을 때 빈 상태 표시

### 26.2 강화된 CSV 임포트 흐름
- `finance-csv-import.tsx` **검토** — 이미 구현된 항목:
  - `CSV_REQUIRED_COLUMNS` 대비 열 매핑 유효성 검증
  - 행 번호 포함 오류 표시 ("Dòng {n}: {message}")
  - 임포트 진행 표시기 (`useTransition`을 통한 `isPending` 상태)
  - 베트남어 성공/실패 요약 (Thành công / Bỏ qua / Lỗi 카드)
- **변경 불필요** — 컴포넌트가 이미 완성 상태

### 26.3 재무 페이지 개선
- `src/app/(dashboard)/finance/page.tsx` **업데이트**
  - `view` 검색 파라미터 추가: `list` (기본값) 또는 `overview`
  - "Danh sách" (목록)과 "Tổng quan" (개요) 탭 간 토글
  - 활성 뷰에 따른 조건부 데이터 페칭
- `src/modules/finance/components/finance-view-toggle.tsx` **생성**
  - 필 스타일 토글이 있는 클라이언트 컴포넌트
  - URL 검색 파라미터를 업데이트하며 다른 필터는 유지

### 26.4 지원 변경사항
- `types.ts`에 `ProjectFinanceSummary` 인터페이스 **추가**
- `queries.ts`에 `getFinanceSummaryByProject()` 쿼리 **추가**
  - 프로젝트 조인으로 모든 기록 페칭
  - 프로젝트별 수입/지출/잔액/건수 집계
  - 잔액 오름차순 정렬 (적자 우선)
- `components/index.ts` **업데이트** — `FinanceDashboard`, `FinanceViewToggle` 재내보내기
- `index.ts` **업데이트** — `FinanceDashboard` 재내보내기

### 26.5 테스트
- `tests/modules/finance/finance-dashboard.test.ts` **생성** — 26개 테스트:
  - VND 포맷팅 (4개 테스트): 양수, 0, 음수, Intl.NumberFormat 일치
  - 요약 계산 (7개 테스트): 총합계, 적자 감지, 정렬 순서, 잔액 공식
  - 수입/지출 분류 (6개 테스트): 6가지 재무 유형 전체
  - CSV 열 유효성 검증 (8개 테스트): 개별 필수 열, 누락 감지, 통과
  - 쿼리 export 검증 (1개 테스트)

## 검증

| 항목 | 결과 |
|------|------|
| `pnpm exec tsc --noEmit` | 통과 (오류 0건) |
| `vitest run finance-dashboard.test.ts` | 통과 (26/26) |
| `vitest run finance.test.ts` | 통과 (58/58, 회귀 없음) |

## 수정/생성된 파일

| 파일 | 작업 |
|------|------|
| `src/modules/finance/types.ts` | 수정 (`ProjectFinanceSummary` 추가) |
| `src/modules/finance/queries.ts` | 수정 (`getFinanceSummaryByProject` 추가) |
| `src/modules/finance/components/finance-dashboard.tsx` | 생성 |
| `src/modules/finance/components/finance-view-toggle.tsx` | 생성 |
| `src/modules/finance/components/index.ts` | 수정 |
| `src/modules/finance/index.ts` | 수정 |
| `src/app/(dashboard)/finance/page.tsx` | 수정 |
| `tests/modules/finance/finance-dashboard.test.ts` | 생성 |
| `build-reports/step-26-csv-import-finance-display.md` | 생성 |

## pACS 자체 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (기능성) | 9/10 | 4개 하위 작업 모두 완료. 대시보드에 VND 포맷팅으로 프로젝트별 그룹화된 재무 표시. CSV 임포트는 이미 모든 기능 보유. 뷰 토글 동작. |
| **C** (완전성) | 9/10 | 모든 컴포넌트 생성, 테스트 작성 (신규 26개 + 기존 58개 통과), TypeScript 클린 컴파일. |
| **L** (학습 용이성) | 9/10 | ref-ux-vietnam.md SOT의 베트남어 라벨 사용. 기존 재무 모듈 컴포넌트와 일관된 패턴. |
| **T** (기술성) | 9/10 | Named export만 사용. `Intl.NumberFormat('vi-VN')`을 통한 VND 포맷팅. `any` 미사용. CONVENTIONS.md 패턴 준수. |

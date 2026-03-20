# Step 27: 리포트 + Excel/PDF 내보내기 — 빌드 리포트

**상태**: 완료
**날짜**: 2026-03-19
**에이전트**: Dashboard Builder

---

## 생성된 파일

| # | 파일 | 용도 |
|---|------|------|
| 1 | `src/modules/reports/types.ts` | ReportType, ExportFormat, ReportConfig, 행 타입, CsvColumn |
| 2 | `src/modules/reports/constants.ts` | 베트남어 라벨, UTF-8 BOM, REPORT_MAX_ROWS |
| 3 | `src/modules/reports/queries.ts` | 4개 리포트 쿼리 함수 (project, finance, task, handover) |
| 4 | `src/modules/reports/actions.ts` | generateReport 서버 액션, exportToCsv, CSV 열 정의 |
| 5 | `src/modules/reports/components/report-generator.tsx` | 클라이언트 측 리포트 설정 폼 + 다운로드 |
| 6 | `src/modules/reports/components/report-preview.tsx` | 리포트 데이터 테이블 미리보기 |
| 7 | `src/modules/reports/components/index.ts` | Barrel export |
| 8 | `src/app/(dashboard)/reports/page.tsx` | 리포트 페이지 (서버 컴포넌트) |
| 9 | `tests/modules/reports/reports.test.ts` | 31개 테스트 — 유효성 검증, 상수, CSV 생성, export |

## 리포트 유형

| 유형 | 베트남어 라벨 | 데이터 소스 |
|------|--------------|-------------|
| `project_summary` | Tổng hợp dự án | projects + tasks (건수) |
| `finance_summary` | Tổng hợp tài chính | financial_records — 프로젝트/유형/카테고리별 그룹화 |
| `task_completion` | Tiến độ công việc | tasks — 프로젝트별 완료율 그룹화 |
| `handover_status` | Tình trạng bàn giao | handovers — 사용자 이름 포함 |

## 내보내기 형식

- **CSV**: Excel 호환을 위한 UTF-8 BOM 접두사, 적절한 필드 이스케이핑
- **JSON**: 메타데이터(type, generatedAt, rowCount) 포함 정렬 출력

## 주요 설계 결정

1. **서버 측 생성, 클라이언트 측 다운로드**: `generateReport` 서버 액션이 콘텐츠 문자열을 반환하고, 클라이언트가 Blob + 다운로드 링크를 생성
2. **VND 포맷팅**: 재무 금액에 대해 CSV 포맷 열에서 `Intl.NumberFormat('vi-VN')` 사용
3. **UTF-8 BOM**: `\uFEFF` 접두사로 Excel에서 올바른 베트남어 문자 인코딩으로 CSV 파일 열기 보장
4. **제한**: 메모리 문제 방지를 위해 리포트당 REPORT_MAX_ROWS = 10,000행
5. **PDF 미포함**: 명세에 따라 제외 (CSV + JSON만 지원); 필요 시 향후 서버 측 라이브러리를 통해 PDF 추가 가능

## 검증

- `pnpm exec tsc --noEmit` — 통과 (오류 0건)
- `pnpm exec vitest run tests/modules/reports/reports.test.ts` — 31/31 통과

## pACS 자체 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (기능성) | 9/10 | 4개 리포트 유형 모두 쿼리, CSV/JSON 내보내기, 클라이언트 다운로드와 함께 구현. JSON용 미리보기. |
| **C** (코드 품질) | 9/10 | CONVENTIONS.md 패턴 준수 (Named export, 베트남어 라벨, Zod 유효성 검증, createAction 래퍼). |
| **L** (현지화) | 10/10 | 모든 사용자 대면 문자열 베트남어. 열 헤더, 라벨, 오류 메시지. |
| **T** (테스팅) | 9/10 | 스키마 유효성 검증, enum 커버리지, 라벨 커버리지, CSV 생성 엣지 케이스, export 검증을 포함한 31개 테스트. |

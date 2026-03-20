# Step 13: 골든 모듈 — 시드 데이터 및 샘플 데이터

**상태**: 완료
**날짜**: 2026-03-19

---

## 요약

`scripts/seed-projects.ts`를 확장하여 베트남 건설/인프라 프로젝트 9개(PRJ-004~PRJ-012)와 프로젝트 멤버 연결 21건을 Docker PostgreSQL 데이터베이스에 시딩했다. `scripts/seed.ts`의 기본 프로젝트 3개(PRJ-001..003)와 합산하면, 데이터셋이 **10개 프로젝트 단계를 모두** 포괄한다.

---

## 시드 데이터 요약

### 프로젝트 (DB 내 총 12개)

| Code | Name | Stage | Province | Priority | Health |
|------|------|-------|----------|----------|--------|
| PRJ-001 | He thong Quan ly Tai lieu Noi bo | in_progress | — | high | on_track |
| PRJ-002 | Nang cap Ha tang Cloud | planning | — | critical | on_track |
| PRJ-003 | Ung dung Cham cong Mobile | review | — | medium | at_risk |
| PRJ-004 | Xay dung Cau Nhat Tan mo rong | in_progress | HN | critical | on_track |
| PRJ-005 | Trung tam Du lieu Da Nang | planning | DN | high | on_track |
| PRJ-006 | Khu Cong nghiep Xanh Binh Duong | testing | BD | medium | at_risk |
| PRJ-007 | He thong Thoat nuoc TP.HCM GD3 | deployment | HCM | critical | on_track |
| PRJ-008 | Phan mem Quan ly Tai chinh DN | staging | HN | high | on_track |
| PRJ-009 | Cang Bien Quoc te Hai Phong | initiation | HP | critical | on_track |
| PRJ-010 | Duong cao toc Can Tho - Ca Mau | completed | CT | high | on_track |
| PRJ-011 | He thong Giam sat Giao thong Da Nang | monitoring | DN | high | on_track |
| PRJ-012 | Nha may Xu ly Nuoc thai Thu Thiem | handover | HCM | medium | on_track |

### 단계 커버리지 (10/10)

| 단계 | 건수 | 프로젝트 |
|------|------|----------|
| initiation | 1 | PRJ-009 |
| planning | 2 | PRJ-002, PRJ-005 |
| in_progress | 2 | PRJ-001, PRJ-004 |
| review | 1 | PRJ-003 |
| testing | 1 | PRJ-006 |
| staging | 1 | PRJ-008 |
| deployment | 1 | PRJ-007 |
| monitoring | 1 | PRJ-011 |
| handover | 1 | PRJ-012 |
| completed | 1 | PRJ-010 |

### 지역 커버리지 (고유 지역 6개)

HN (Ha Noi), HCM (TP. Ho Chi Minh), DN (Da Nang), BD (Binh Duong), HP (Hai Phong), CT (Can Tho)

모든 값이 `src/modules/projects/constants.ts`의 `PROVINCES` 상수 항목과 일치한다.

### 우선순위 분포

- critical: 4건 (PRJ-002, 004, 007, 009)
- high: 5건 (PRJ-001, 005, 008, 010, 011)
- medium: 3건 (PRJ-003, 006, 012)
- low: 0건

### 건강 상태 분포

- on_track: 10건
- at_risk: 2건 (PRJ-003, PRJ-006)
- delayed: 0건
- blocked: 0건

### 프로젝트 멤버: 추가 프로젝트 9개에 걸쳐 총 21건의 연결

---

## seed-projects.ts 수정 내역

1. **프로젝트 2개 추가** (PRJ-011, PRJ-012) — 누락되었던 `monitoring` 및 `handover` 단계 커버리지 확보
2. **프로젝트 멤버 시드 데이터 추가** — 사용자와 추가 프로젝트 9개를 연결하는 21건의 연결 데이터
3. **정수 오버플로 수정** — PRJ-006, 007, 009, 010의 예산 값을 PostgreSQL `integer` 최대값(2,147,483,647) 이내로 축소
4. **멱등성 개선** — 프로젝트 멤버 삽입 시 try/catch와 PostgreSQL 에러 코드 `23505`(고유 제약 조건 위반) 감지를 활용하여 재실행 시에도 안전
5. **요약 출력 추가** — 시딩 완료 후 전체 프로젝트 수와 단계 커버리지를 출력하도록 개선

---

## Docker 검증 결과

```
$ docker exec projectopsosdb psql -U postgres -d projectops -c "SELECT count(*) FROM projects;"
 count
-------
    12

$ docker exec projectopsosdb psql -U postgres -d projectops -c "SELECT stage, count(*) FROM projects GROUP BY stage ORDER BY stage;"
    stage    | count
-------------+-------
 completed   |     1
 deployment  |     1
 handover    |     1
 in_progress |     2
 initiation  |     1
 monitoring  |     1
 planning    |     2
 review      |     1
 staging     |     1
 testing     |     1
(10 rows)

$ docker exec projectopsosdb psql -U postgres -d projectops -c "SELECT count(*) FROM project_members;"
 count
-------
    21
```

멱등성 검증 완료: 두 번째 실행 시 프로젝트와 멤버 모두 `0 created`로 출력되며 에러 없음.

---

## TypeScript 검사

```
$ pnpm exec tsc --noEmit
(exit 0 — no errors)
```

---

## 통합 참고사항

- `seed-projects.ts`는 독립적인 보조 스크립트이며, `seed.ts`에서 호출되지 않는다
- 실행 순서: `seed.ts`를 먼저 실행(부서, 역할, 사용자, 기본 프로젝트 생성)한 후 `seed-projects.ts`를 실행
- 두 스크립트 모두 `.env`의 `DATABASE_URL`을 사용한다 (하드코딩된 자격 증명 없음)

---

## 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `scripts/seed-projects.ts` | 프로젝트 2개 추가(monitoring, handover), 프로젝트 멤버 21건 추가, 정수 오버플로 수정, 멱등성 개선 |

---

## pACS 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (충실도) | 95 | 10개 단계 전수 커버리지, constants.ts 기반 지역 값, FK 제약 준수, 현실적인 베트남식 명칭 |
| **C** (완전성) | 95 | 전체 단계 커버리지, 프로젝트 멤버 시딩, 멱등성 확보, Docker 검증 완료, tsc 통과 |
| **L** (명료성) | 90 | 스크립트 주석 충실, 요약 출력으로 검증 용이, 기본 시드와 명확히 분리 |
| **T** (기술) | 92 | 고유 제약 위반에 대한 적절한 에러 처리, int32 예산 수정, Drizzle ORM 패턴 준수 |
| **최종** | **93** | 산술 평균: F(95) + C(95) + L(90) + T(92) = 372 / 4 |

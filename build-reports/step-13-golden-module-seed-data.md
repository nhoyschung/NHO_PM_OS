# Step 13: Golden Module — Seed & Sample Data

**Status**: COMPLETE
**Date**: 2026-03-19

---

## Summary

Enhanced `scripts/seed-projects.ts` to seed 9 additional Vietnamese construction/infrastructure projects (PRJ-004 through PRJ-012) plus 21 project member associations into the live Docker PostgreSQL database. Combined with the 3 base projects from `scripts/seed.ts` (PRJ-001..003), the dataset covers **all 10 project stages**.

---

## Seed Data Summary

### Projects (12 total in DB)

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

### Stage Coverage (10/10)

| Stage | Count | Projects |
|-------|-------|----------|
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

### Province Coverage (6 unique provinces)

HN (Ha Noi), HCM (TP. Ho Chi Minh), DN (Da Nang), BD (Binh Duong), HP (Hai Phong), CT (Can Tho)

All values match `PROVINCES` constant entries in `src/modules/projects/constants.ts`.

### Priority Distribution

- critical: 4 (PRJ-002, 004, 007, 009)
- high: 5 (PRJ-001, 005, 008, 010, 011)
- medium: 3 (PRJ-003, 006, 012)
- low: 0

### Health Status Distribution

- on_track: 10
- at_risk: 2 (PRJ-003, PRJ-006)
- delayed: 0
- blocked: 0

### Project Members: 21 associations across 9 additional projects

---

## Modifications Made to seed-projects.ts

1. **Added 2 new projects** (PRJ-011, PRJ-012) to cover the missing `monitoring` and `handover` stages
2. **Added project_members seed data** — 21 associations linking users to the 9 additional projects
3. **Fixed integer overflow** — reduced budget values for PRJ-006, 007, 009, 010 to fit within PostgreSQL `integer` (max 2,147,483,647)
4. **Improved idempotency** — project members use try/catch with PostgreSQL error code `23505` detection (unique constraint violation), so re-runs are safe
5. **Added summary output** — script now prints total project count and stage coverage after seeding

---

## Docker Verification Results

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

Idempotency verified: second run produces `0 created` for both projects and members with no errors.

---

## TypeScript Check

```
$ pnpm exec tsc --noEmit
(exit 0 — no errors)
```

---

## Integration Notes

- `seed-projects.ts` is a standalone supplementary script, not called from `seed.ts`
- Execution order: run `seed.ts` first (creates departments, roles, users, base projects), then `seed-projects.ts`
- Both scripts use `DATABASE_URL` from `.env` (no hardcoded credentials)

---

## Files Modified

| File | Change |
|------|--------|
| `scripts/seed-projects.ts` | Added 2 projects (monitoring, handover), 21 project members, fixed int overflow, improved idempotency |

---

## pACS Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F** (Fidelity) | 95 | All 10 stages covered, province values from constants.ts, FK constraints respected, realistic Vietnamese names |
| **C** (Completeness) | 95 | Full stage coverage, project members seeded, idempotent, Docker verified, tsc clean |
| **L** (Lucidity) | 90 | Script is well-commented, summary output aids verification, clear separation from base seed |
| **T** (Technical) | 92 | Proper error handling for unique violations, int32 budget fix, Drizzle ORM patterns followed |
| **Final** | **93** | Arithmetic mean of F(95) + C(95) + L(90) + T(92) = 372 / 4 |

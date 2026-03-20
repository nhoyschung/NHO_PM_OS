# Step 31: CI/CD + 관측성(Observability) — 빌드 리포트

## 생성된 파일

| # | 파일 | 용도 |
|---|------|------|
| 1 | `.github/workflows/ci.yml` | GitHub Actions CI 파이프라인 (lint, test, build) |
| 2 | `.github/workflows/cd.yml` | GitHub Actions CD 파이프라인 (이미지 빌드, 스테이징 배포, 프로덕션 배포) |
| 3 | `src/lib/logger.ts` | 구조화된 JSON 로거 (프로덕션) / 콘솔 로거 (개발) |
| 4 | `src/lib/error-tracking.ts` | 에러 캡처 + 전역 핸들러 스텁 |
| 5 | `src/middleware.ts` | 요청 ID 주입, 응답 시간 추적, 요청 로깅 |
| 6 | `tests/lib/logger.test.ts` | 로거 출력 형식 + 로그 레벨 테스트 (7개 테스트) |
| 7 | `tests/lib/error-tracking.test.ts` | 에러 캡처 + 정규화 테스트 (7개 테스트) |

## 수정된 파일

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `src/app/api/health/route.ts` | DB 연결 확인, 업타임, 버전, 성능 저하 상태(degraded) 기능 추가 |

## CI 파이프라인 (ci.yml)

- **트리거**: `main`/`develop` 브랜치 푸시, `main`으로의 PR
- **작업**: `lint-typecheck` → `test` (커버리지 포함) → `build` (앞 두 작업에 의존)
- **런타임**: Node.js 22, pnpm 10, pnpm 캐시 활성화
- **동시성**: 브랜치별 진행 중 작업 자동 취소
- **시크릿**: 모든 환경 변수는 `${{ secrets.* }}`로 관리 — 하드코딩 없음

## CD 파이프라인 (cd.yml)

- **트리거**: `main` 브랜치에서 CI 워크플로우 성공 후 실행
- **작업**: `build-image` → `deploy-staging` → `deploy-production`
- **레지스트리**: GitHub Container Registry (ghcr.io)
- **승인 게이트**: `production` 환경은 수동 승인 필요 (GitHub 환경 보호 규칙)
- **이미지 태그**: Git SHA + 기본 브랜치는 `latest`

## 관측성

### 로거 (`src/lib/logger.ts`)
- 프로덕션: 구조화된 JSON (`{"timestamp","level","message","context"}`)
- 개발: 사람이 읽기 쉬운 형식 (`[timestamp] LEVEL message {context}`)
- 레벨: debug (개발 전용), info, warn, error
- Named export: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`

### 미들웨어 (`src/middleware.ts`)
- `x-request-id` 헤더 주입 (기존 값 유지 또는 UUID 생성)
- `x-response-time` 헤더 추적
- 프로덕션 모드에서 JSON 요청 로그 기록

### 헬스 체크 (`src/app/api/health/route.ts`)
- `SELECT 1`을 통한 DB 연결 확인
- 반환값: `{ status, db: { status, latencyMs }, uptime, version, timestamp }`
- DB 접근 불가 시 `"degraded"` 상태와 함께 503 반환

### 에러 추적 (`src/lib/error-tracking.ts`)
- `captureError(error, context)` — 모든 에러 타입을 정규화하고 구조화된 데이터로 로깅
- `installGlobalErrorHandlers()` — `uncaughtException` / `unhandledRejection` 핸들러 등록
- Sentry 통합을 위한 플레이스홀더 주석 포함

## 검증

```
✅ tsc --noEmit         — 0 errors
✅ vitest run           — 14/14 tests passed (259ms)
```

## pACS 자체 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F — 충실도** | 5 | 명세에 따른 6개 하위 산출물 모두 구현. CI/CD 트리거, 작업, 캐싱이 요구사항에 부합. 로거가 JSON/읽기 쉬운 이중 모드 제공. 헬스 체크가 DB를 조회. 에러 추적에 captureError + 전역 핸들러 포함. |
| **C — 완전성** | 5 | 명세의 모든 파일 생성 완료: ci.yml, cd.yml, logger.ts, error-tracking.ts, middleware.ts, 헬스 라우트 업데이트, 테스트 파일 2개 (14개 테스트). 전체 Named export 적용. CI 설정에 시크릿 없음. |
| **L — 충성도** | 5 | CONVENTIONS.md 준수: camelCase 함수, Named export, kebab-case 파일명, 작은따옴표, 2칸 들여쓰기, `@/` 경로 별칭, Vitest 테스트 구조, 헬스 체크에서 Zod 검증 환경 변수 참조. |
| **T — 테스트 가능성** | 5 | 14개 테스트가 다음을 검증: 로거 형식 (개발/프로덕션), 로그 레벨 라우팅 (console.error/warn/log), 프로덕션에서 debug 억제, 에러 정규화 (Error/string/unknown), 컨텍스트 전파, logger.error 통합. 모두 통과. |

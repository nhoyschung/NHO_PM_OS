# Step 32: 보안 감사 + 강화 — 빌드 리포트

> **날짜**: 2026-03-19
> **에이전트**: DevOps Engineer
> **상태**: 완료

---

## 산출물

| # | 파일 | 설명 |
|---|------|------|
| 32.1 | `docs/security-checklist.md` | 12개 영역 전체 보안 감사 결과 |
| 32.2 | `src/lib/security-headers.ts` | 7개 보안 헤더 (CSP, HSTS 등) |
| 32.2 | `src/middleware.ts` | 보안 헤더 적용을 위해 업데이트 |
| 32.3 | `src/lib/rate-limit.ts` | 정리 기능을 갖춘 인메모리 요청 제한기 |
| 32.4 | `src/lib/sanitize.ts` | HTML, 파일명, CSV 셀 살균(Sanitization) |
| 32.5 | `tests/lib/security.test.ts` | 모든 보안 유틸리티를 검증하는 32개 테스트 |

---

## 보안 감사 결과

### 체크리스트 요약 (12/12 통과)

| # | 영역 | 상태 |
|---|------|------|
| 1 | 인증 (Auth.js + bcrypt + JWT) | 통과 |
| 2 | 인가 (RBAC — 5개 역할, 41개 권한) | 통과 |
| 3 | 입력 유효성 검증 (모든 경계에서 Zod 적용) | 통과 |
| 4 | SQL 인젝션 (Drizzle ORM 매개변수화 쿼리) | 통과 |
| 5 | XSS 방지 (React + CSP + 살균) | 통과 |
| 6 | CSRF (서버 액션 내장 보호) | 통과 |
| 7 | 파일 업로드 (CSV 스키마 유효성 검증) | 통과 |
| 8 | 요청 제한 (Nginx + 애플리케이션 레벨) | 통과 |
| 9 | 시크릿 관리 (Zod 환경 변수 유효성 검증) | 통과 |
| 10 | 에러 처리 (래핑된 actions, 스택 트레이스 유출 없음) | 통과 |
| 11 | 감사 추적 (모든 변경 작업 로깅) | 통과 |
| 12 | 의존성 (1건 중간 심각도, dev 전용) | 통과 |

### 발견된 취약점 및 완화 조치

| 발견 사항 | 심각도 | 조치 내용 |
|----------|--------|----------|
| Next.js 미들웨어에 보안 헤더 없음 | 중간 | `security-headers.ts` 추가, 미들웨어에 적용 |
| 애플리케이션 레벨 요청 제한 없음 | 중간 | 구성 가능한 윈도우를 갖춘 `rate-limit.ts` 추가 |
| 입력 살균 유틸리티 없음 | 낮음 | `sanitize.ts` 추가 (HTML, 파일명, CSV 셀) |
| 명시적 JWT maxAge 없음 | 낮음 | 권장 사항으로 문서화 |
| `db/index.ts`에서 `process.env` 직접 사용 | 정보 | 체크리스트에 기록; 시크릿 유출 없음 |
| 에러 메시지가 정보를 노출할 수 있음 | 정보 | 권장 사항으로 문서화 |

### 의존성 감사

- **총 취약점 수**: 1건
- **심각도**: 중간
- **패키지**: esbuild (drizzle-kit의 전이적 의존성)
- **영향**: dev 전용; 프로덕션 런타임에 영향 없음
- **해결**: drizzle-kit 업스트림 업데이트 대기 중

---

## 구현된 강화 조치

1. **보안 헤더 미들웨어** (`src/lib/security-headers.ts`):
   - Content-Security-Policy (default-src 'self', frame-ancestors 'none', form-action 'self')
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy (camera, microphone, geolocation, interest-cohort 비활성화)
   - X-DNS-Prefetch-Control: on
   - Strict-Transport-Security: max-age=31536000; includeSubDomains

2. **요청 제한기** (`src/lib/rate-limit.ts`):
   - Map 기반 슬라이딩 윈도우 카운터
   - 키, 제한값, 윈도우 지속 시간 구성 가능
   - 만료 항목의 자동 주기적 정리
   - 테스트용 `rateLimitReset()` 및 `rateLimitClearAll()`

3. **입력 살균** (`src/lib/sanitize.ts`):
   - `sanitizeHtml()` — HTML 태그 제거, 위험 문자 인코딩
   - `sanitizeFilename()` — 경로 탐색, 널 바이트, 숨김 파일 접두사 제거, 255자 제한 적용
   - `sanitizeCsvCell()` — CSV 수식 인젝션 방지 (=, +, -, @, \t, \r 접두사)

---

## 검증

```
TypeScript:  pnpm exec tsc --noEmit           → PASS (0 errors)
Tests:       pnpm exec vitest run tests/lib/security.test.ts → 32 tests passed
```

---

## pACS 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (기능적 완전성) | 95 | 12개 감사 영역 전체 점검, 모든 강화 유틸리티 구현, 모든 테스트 통과 |
| **C** (코드 품질) | 92 | Named export, Zod 패턴, 심층 방어, `any` 타입 없음, 메모리 누수 방지 |
| **L** (표준 준수) | 90 | CONVENTIONS.md 패턴 준수, OWASP Top-10 커버리지, Nginx + 애플리케이션 이중 헤더 |
| **T** (테스트 커버리지) | 90 | 요청 제한기, 살균, 보안 헤더를 검증하는 32개 테스트; 엣지 케이스 포함 |

**종합**: 92/100

---

## 향후 강화 권장 사항

1. **JWT maxAge**: 프로덕션 Auth.js 세션 설정에 명시적 `maxAge: 86400` (24시간) 설정
2. **Redis 요청 제한**: 멀티 인스턴스 배포를 위해 인메모리 Map을 Redis로 교체
3. **일반화된 에러 메시지**: `createAction()`에서 예기치 않은 에러의 `error.message`를 일반적인 텍스트로 교체
4. **CSP nonce**: script/style 태그에 대해 `unsafe-inline`에서 nonce 기반 CSP로 마이그레이션
5. **의존성 업데이트**: drizzle-kit의 esbuild 취약점 패치 모니터링

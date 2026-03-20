# Step 30: 프로덕션 Docker + 배포 구성

## 상태: 완료

## 요약

ProjectOpsOS Next.js 애플리케이션을 PostgreSQL, Nginx 리버스 프록시, 무중단 배포 스크립트와 함께 배포하기 위한 프로덕션용 Docker 구성을 생성했다.

## 생성된 파일

| # | 파일 | 용도 |
|---|------|------|
| 30.1 | `Dockerfile` | 멀티 스테이지 빌드(deps -> build -> runner), Node.js 22 Alpine 기반 |
| 30.2 | `docker-compose.prod.yml` | 프로덕션 Compose: app + db + nginx 서비스 |
| 30.3 | `.env.production.example` | 플레이스홀더 시크릿을 포함한 환경 변수 템플릿 |
| 30.4 | `nginx/nginx.conf` | SSL, gzip, 보안 헤더, 요청 제한(Rate Limiting)을 갖춘 리버스 프록시 |
| 30.5a | `scripts/deploy.sh` | 무중단 배포: 빌드, 마이그레이션, 교체, 헬스 체크 |
| 30.5b | `scripts/db-migrate.sh` | 사전/사후 헬스 체크를 포함한 데이터베이스 마이그레이션 실행기 |
| 30.6 | `.dockerignore` | node_modules, .next, .git, tests, secrets 제외 |
| 30.7 | `src/app/api/health/route.ts` | Docker HEALTHCHECK용 헬스 체크 엔드포인트 |

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `next.config.ts` | Docker 독립 실행형 빌드를 위해 `output: "standalone"` 추가 |
| `src/modules/reports/actions.ts` | `exportToCsv`를 `csv-utils.ts`로 이동 (수정: `'use server'` 파일 내 동기 함수 문제) |
| `src/modules/reports/csv-utils.ts` | **신규** — actions에서 추출한 순수 CSV 유틸리티 |
| `tests/modules/reports/reports.test.ts` | `exportToCsv` 임포트 경로 업데이트 |
| `src/app/(partner)/` -> `src/app/partner/` | 라우트 그룹을 실제 URL 세그먼트로 변경 (수정: `/projects/[*]` 모호한 라우트 문제) |

## 기존 이슈 수정 사항

### 1. 모호한 라우트 패턴
- **문제**: `(dashboard)/projects/[slug]`와 `(partner)/projects/[id]`가 모두 `/projects/[*]`로 해석됨. Next.js URL 해석에서 라우트 그룹 `()`은 투명하게 처리되기 때문.
- **수정**: `(partner)`를 `partner`(실제 URL 세그먼트)로 변경하여 파트너 라우트가 `/partner/projects/[id]`에 위치하도록 함.
- **영향**: 파트너 사이드바가 이미 `/partner/projects` URL을 참조하고 있어 링크 변경이 불필요함.

### 2. 'use server' 파일 내 동기 함수 Export
- **문제**: `exportToCsv`가 `'use server'` 파일에서 비동기가 아닌 export 함수로 존재함. Next.js 프로덕션 빌드는 서버 액션 파일의 모든 export가 async일 것을 요구함.
- **수정**: `exportToCsv`와 `escapeCsvField`를 `src/modules/reports/csv-utils.ts`로 추출. actions 파일과 테스트 파일의 임포트 경로를 업데이트함.

## Docker 이미지 상세

| 항목 | 값 |
|------|-----|
| 베이스 이미지 | `node:22-alpine` |
| 빌드 스테이지 | 3단계 (deps, builder, runner) |
| 최종 이미지 크기 | **287 MB** |
| 실행 사용자 | `nextjs` (비루트, UID 1001) |
| 노출 포트 | 3000 |
| 헬스 체크 | 30초마다 `wget http://localhost:3000/api/health` |

## 아키텍처

```
Internet -> Nginx (80/443) -> Next.js App (3000) -> PostgreSQL (5432)
                |                    |
           SSL termination     standalone server
           gzip compression    non-root user
           security headers    health check
           rate limiting       ENV injection
```

## 검증

- [x] `tsc --noEmit` 통과 (0 에러)
- [x] `docker build -t projectopsosdb-app .` 성공
- [x] 이미지 크기: 287 MB (멀티 스테이지로 최소화)
- [x] 비루트 사용자 (`nextjs:nodejs`)
- [x] Dockerfile 또는 docker-compose에 시크릿 없음
- [x] app 및 db 서비스 모두 헬스 체크 적용
- [x] `.dockerignore`에서 민감 파일 제외

## 보안 조치

1. **비루트 사용자**: 프로덕션 이미지에서 `nextjs` (UID 1001) 사용
2. **시크릿 미포함**: 모든 시크릿은 환경 변수 / `.env.production`을 통해 주입
3. **Nginx 보안 헤더**: X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy
4. **요청 제한**: API 라우트에 대해 IP당 30 req/s
5. **TLS 1.2+**: 최신 암호화 설정
6. **최소 이미지**: standalone 출력물 + 정적 파일만 runner 스테이지에 복사

## pACS 자체 평가

| 차원 | 점수 | 근거 |
|------|------|------|
| **F** (충실도) | 9/10 | 모든 명세 항목 구현 완료. Nginx 포함(권장 사항 반영). |
| **C** (완전성) | 9/10 | Dockerfile, Compose, 환경 변수 템플릿, Nginx, 배포 스크립트, dockerignore, 헬스 체크 모두 포함. |
| **L** (논리적 건전성) | 9/10 | 멀티 스테이지 빌드가 올바르게 구성됨. standalone 출력이 적절히 설정됨. 기존 빌드 이슈 2건을 발견하여 수정함. |
| **T** (기술적 정확성) | 9/10 | Docker 빌드 성공 검증 완료. 이미지가 적절한 standalone 서버와 함께 Node.js 22 Alpine에서 실행됨. |

## 배포 지침

```bash
# 1. Configure environment
cp .env.production.example .env.production
# Edit .env.production with real values

# 2. Place SSL certificates
mkdir -p nginx/certs
# Copy fullchain.pem and privkey.pem to nginx/certs/

# 3. Deploy
bash scripts/deploy.sh
```

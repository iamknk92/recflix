# Changelog

All notable changes to RecFlix will be documented in this file.

## [Unreleased]

---

## [2026-02-20] — 2차 업데이트

### Added
- **MBTI 궁합 추천 기능**
  - `backend/app/data/mbti_compatibility.py`: 4축(E/I, S/N, T/F, J/P) 기반 궁합 점수(0~100) 계산 모듈
    - INTJ×ENFP, INFJ×ENTP 등 10개 특별 조합 커스텀 설명 포함
  - `GET /api/v1/recommendations/match?mbti1=INTJ&mbti2=ENFP`: 두 MBTI 모두 만족하는 영화 추천 API
  - `frontend/app/match/page.tsx`: MBTI 궁합 추천 페이지
    - 4축 토글 방식 MBTI 선택 (E↔I, S↔N, T↔F, J↔P)
    - SVG 링 차트로 궁합 점수 시각화
    - 영화 카드에 mbti1/mbti2 점수 바 표시
    - INTJ×ENFP 등 유명 조합 퀵 예시 버튼 4개
  - `frontend/lib/api.ts`: `getMatchRecommendations()` 함수 추가
  - `frontend/components/layout/Header.tsx`: 로그인 시 "MBTI 궁합" 메뉴 노출

### Fixed
- **로그인 불가 버그** (`deps.py`)
  - `sentry_sdk.set_user({"username": user.username})` — User 모델에 없는 `username` 속성 참조
  - → `user.email`로 수정. 로그인 후 `/users/me` 등 모든 인증 엔드포인트 500 오류 해결
- **회원가입/로그인 400 오류** (`main.py`)
  - sentry-sdk 2.x `FastApiIntegration`이 request body stream을 먼저 소비 → FastAPI가 body를 읽지 못해 `400 "There was an error parsing the body"` 반환
  - → `FastApiIntegration()` 제거 (sentry-sdk 2.x는 FastAPI 자동 감지)

### Changed
- **MBTI 궁합 추천 알고리즘 개선** (`recommendations.py`)
  - 후보 풀: `popularity >= 10`, `vote_count >= 500` 필터 (부족 시 5/300 fallback)
  - 스코어 재설계: MBTI 매치 60% + 인기도(log 정규화) 25% + 품질(weighted_score) 15% - 편차 패널티
  - 효과: 저인기 영화 → 나이브스 아웃, 아바타, 어벤져스 등 인지도 있는 영화로 개선

---

## [2026-02-20] — 1차 업데이트

### Added
- **PWA 지원**: `next-pwa` 기반 Service Worker, 오프라인 페이지, 앱 아이콘
  - `public/sw.js` 자동 생성 (빌드 시)
  - `app/offline/page.tsx` - 오프라인 안내 페이지 + 재시도 버튼
  - `public/icons/icon-192.png`, `icon-512.png` - PWA 아이콘
  - `public/manifest.json` - 앱 이름, 테마 색상(`#e50914`), standalone 모드
  - 런타임 캐싱: API NetworkFirst(5분), TMDB 이미지 CacheFirst(7일), JS/CSS StaleWhileRevalidate
  - 오프라인 폴백: `fallbacks.document = "/offline"`
- **Sentry 에러 모니터링 - 프론트엔드** (Next.js 14 App Router 규약)
  - `instrumentation.ts` - 서버/엣지 Sentry 초기화 (`register()` 함수)
  - `instrumentation-client.ts` - 클라이언트 초기화 + Session Replay(에러 100%, 평소 5%) + `onRouterTransitionStart`
  - `app/global-error.tsx` - React 렌더링 에러 캡처 및 복구 UI
- **Sentry 에러 모니터링 - 백엔드** (FastAPI)
  - `sentry-sdk[fastapi]>=1.45.0` 추가
  - `FastApiIntegration` + `SqlalchemyIntegration` (DSN 있을 때만 초기화)
  - `get_current_user`에서 `sentry_sdk.set_user()` 호출 (에러 시 사용자 추적)
  - `SENTRY_DSN` 환경변수: 로컬 `.env`, Vercel, Railway 모두 설정

### Fixed
- **`offline/page.tsx` 빌드 에러**: `onClick` 핸들러가 있는 Server Component → `"use client"` 추가
- **GitHub Actions CI/CD**: `vercel pull --token` 팀 인증 실패 반복
  - `amondnet/vercel-action@v25` 마켓플레이스 액션으로 교체 후 해결

### Changed
- **`next.config.js`**: `fallbacks: { document: "/offline" }` 추가 (PWA 오프라인 폴백)
- **`frontend/.gitignore`**: `public/fallback-*.js` 빌드 아티팩트 제외 추가
- **`sentry.{client,server,edge}.config.ts`** 삭제 → `instrumentation.ts`, `instrumentation-client.ts`로 대체
- **`.github/workflows/vercel-deploy.yml`**: `amondnet/vercel-action@v25` 사용, VERCEL_TOKEN 진단 스텝 추가

### Technical Details
- `frontend/instrumentation.ts` - Next.js 14 서버/엣지 Sentry 초기화
- `frontend/instrumentation-client.ts` - 클라이언트 Sentry + Session Replay
- `frontend/app/global-error.tsx` - React 전역 에러 바운더리
- `backend/app/main.py` - Sentry FastAPI/SQLAlchemy 통합
- `backend/app/core/deps.py` - 로그인 사용자 Sentry 컨텍스트 설정
- `.github/workflows/vercel-deploy.yml` - CI/CD 최종 완성

---

## [2026-02-19]

### Added
- **내 취향 분석 페이지** (`/my-taste`): 사용자 평점 기반 취향 대시보드
  - `GenreDonutChart` - 선호 장르 도넛 차트 (4점 이상 평점 기준)
  - `ScoreBarChart` - 별점 분포 막대 차트
  - `WeatherRadarChart` - 날씨별 선호 장르 레이더 차트
  - `StatsSummaryCards` - 총 평가 수 / 찜 수 / 평균 별점 요약 카드
  - `TopCreatorsSection` - 자주 본 감독/배우 Top 3
- **`GET /api/v1/ratings/stats`** 엔드포인트: 장르 분포, 별점 분포, 날씨별 장르 맵, 감독/배우 Top 3
- **빈 상태(Empty State) UX**: 비로그인 → 로그인 유도 / 평점 5편 미만 → 진행률 바 표시 (Framer Motion)
- **weather_context 자동 주입**: 평점 저장 시 `localStorage("recflix_weather")` 캐시에서 날씨 자동 주입
- **헤더 "내 취향 분석" 메뉴**: `Header.tsx`에 `/my-taste` 링크 추가
- **GitHub Actions CI/CD** (`.github/workflows/vercel-deploy.yml`): `main` push 시 Vercel 프로덕션 자동 배포
  - `VERCEL_TOKEN` GitHub Secret 기반 인증
  - `namkyungs-projects/jnsquery-reflix` 프로젝트 타겟

### Fixed
- **메인 페이지 로딩 멈춤**: 날씨 로드(지오로케이션 최대 5초)를 기다리지 않고 즉시 추천 API 호출
  - `if (!weather) return` 제거 → `weather?.condition` 사용
  - `loading` 초기값 `true` → `false`, 전체화면 스피너 제거
  - 즉시 스켈레톤 rows 표시 후 ~1s 내 콘텐츠 렌더
- **Next.js 빌드 캐시 깨짐**: `npm run build`와 dev 서버 동시 실행 시 `.next` 충돌 문제 정립
  - `npm run build` 전 dev 서버 반드시 종료 필요

### Changed
- **`next.config.js`**: `transpilePackages: ["recharts"]` 추가 — Vercel 프로덕션 빌드 ESM 호환
- **`frontend/lib/utils.ts`**: `getImageUrl`, `formatDate`, `formatRuntime`, `formatScore` 유틸 생성
- **`frontend/lib/api.ts`**: `fetchRatingStats()` 함수 추가
- **`frontend/types/index.ts`**: `RatingStats` 타입 추가
- **`frontend/stores/interactionStore.ts`**: `setRating()` 내 weather_context 자동 주입 로직 추가
- **프로덕션 프론트엔드 URL**: `https://jnsquery-reflix-eight.vercel.app` (Vercel 팀 프로젝트 재배포)

---

## [2026-02-10]

### Added
- **신규 CSV 데이터 마이그레이션**: 32,625편 → **42,917편** (+10,292편)
- **Movie 모델 6컬럼 추가**: `director`, `director_ko`, `cast_ko`, `production_countries_ko`, `release_season`, `weighted_score`
- **DB 마이그레이션 스크립트**: `backend/scripts/migrate_add_columns.py`
- **CSV 임포트 스크립트**: `backend/scripts/import_csv_data.py`, `import_relationships.py`, `import_production.py`
- **mbti/weather 점수 생성 스크립트**: `backend/scripts/generate_mbti_weather_scores.py`
  - MBTI 16개 유형별 장르+감정 기반 점수 산출
  - 날씨 4개 타입별 장르+감정 기반 점수 산출 (부스트/페널티 로직)
- **LLM emotion_tags 복원**: 백업 JSON에서 996편 복원
- **키워드 기반 emotion_tags**: 18,587편 신규 생성 (overview 컬럼 사용으로 변경)
- **프로덕션 DB 복원**: `pg_dump` → `pg_restore`로 Railway PostgreSQL에 전체 데이터 적용

### Changed
- **Vercel 프로젝트 이름 변경**: `frontend` → `jnsquery-reflix`
- **프로덕션 프론트엔드 URL**: `https://jnsquery-reflix.vercel.app`
- **Railway CORS_ORIGINS 업데이트**: 새 도메인 반영
- **로컬 `.env` CORS_ORIGINS**: 명시적으로 추가 및 동기화
- **README**: 프론트엔드 URL 업데이트
- **regenerate_emotion_tags.py**: `overview_ko` → `overview` 사용, LLM 식별을 기존 태그 존재 여부로 변경
- **Pydantic MovieDetail 스키마**: 신규 6개 필드 추가 및 `from_orm_with_relations` 매핑
- **.gitignore**: `*.csv` 패턴 추가 (대용량 CSV 제외)

### Data Statistics
- 영화: 42,917편
- emotion_tags: 42,917 (100%)
- mbti_scores: 42,917 (100%)
- weather_scores: 42,917 (100%)
- 관계: movie_genres 98,767 / movie_cast 252,662 / movie_keywords 77,660 / movie_countries 55,265 / similar_movies 101,386

---

## [2026-02-09]

### Added
- **LLM 기반 emotion_tags 분석**: Claude API를 사용한 상위 1,000편 영화 감성 분석
  - 새 스크립트: `backend/scripts/llm_emotion_tags.py`
  - 모델: claude-sonnet-4-20250514
  - 10편씩 배치 처리로 API 비용 최적화
- **기분(Mood) 선택 UI**: 6가지 기분 2x3 그리드 배치
  - 😌 편안한, 😰 긴장감, 😆 신나는
  - 💕 감성적인, 🔮 상상에빠지고싶은, 😄 가볍게볼래
- **네거티브 키워드 & 장르 페널티 로직**: 클러스터와 반대되는 키워드/장르 감점
- **30% LLM 보장 혼합 정렬**: 추천 풀에서 최소 30% LLM 분석 영화 포함
- **품질 필터**: 모든 추천에 vote_count >= 30, vote_average >= 5.0 적용
- **🔄 새로고침 버튼**: 모든 영화 섹션 제목 우측에 추가
  - 클릭 시 풀(50개) 내에서 20개 재셔플 (API 호출 없음)
  - Fisher-Yates 알고리즘 사용
  - 회전 애니메이션 피드백

### Changed
- **맞춤 추천 영화 수 증가**: 10개 → 20개 (풀 40개에서 셔플)
- **섹션별 표시 영화 수**: 20개 표시, 50개 풀에서 셔플
- **emotion_tags 키워드 점수 상한**: 0.7로 제한 (LLM 영화와의 균형)
- **emotion_tags 7대 클러스터 재정의**: healing, tension, energy, romance, deep, fantasy, light
- **섹션 순서 로그인 상태별 분리**:
  - 로그인: 개인화 우선 (MBTI → 날씨 → 기분 → 인기 → 평점)
  - 비로그인: 범용 우선 (인기 → 평점 → 날씨 → 기분)
- **로그아웃 시 즉시 UI 갱신**: Zustand 스토어 초기화 + 추천 데이터 재요청
- **유도 섹션 UI 통일**: w-80 너비, 동일한 스타일 적용
- **감성적 이모지 변경**: 🥹 → 💕 (크로스 플랫폼 호환성)
- **장르 부스트 강화**: 0.1 → 0.15로 상향
- **light 클러스터 개선**: 부스트 장르에 "가족" 추가, 한국어 키워드 14개 추가
- **healing/deep 분리**: healing에서 "드라마" 제거, deep과 명확히 구분

### Technical Details
- `backend/scripts/llm_emotion_tags.py` - Claude API 기반 emotion_tags 생성
- `backend/scripts/regenerate_emotion_tags.py` - 키워드 기반 emotion_tags 생성 (0.7 상한)
- `backend/app/api/v1/recommendations.py` - 30% LLM 보장 혼합 정렬 구현
- `frontend/components/movie/FeaturedBanner.tsx` - 기분 선택 UI 개선
- `docs/RECOMMENDATION_LOGIC.md` - 추천 로직 상세 문서 업데이트

---

## [2026-02-04]

### Added
- **LLM 캐치프레이즈 기능**: Anthropic Claude API를 사용한 영화별 맞춤 캐치프레이즈 생성
  - 새 API 엔드포인트: `GET /api/v1/llm/catchphrase/{movie_id}`
  - Redis 캐싱 (24시간 TTL)
  - 영화 상세 페이지에 캐치프레이즈 표시
- **메인 배너 MBTI 유도 섹션**: 로그인/MBTI 설정 유도 메시지
- **내 리스트 버튼 기능**: 로그인 체크, 찜하기 토글 연동

### Changed
- **헤더 메뉴명**: "영화" → "영화 검색"
- **메인 배너 레이아웃**: 영화 정보 좌측 하단, MBTI 유도 우측 상단
- **배너 높이**: 70vh → 55vh/60vh/65vh (반응형)
- **영화 목록**: 10개 → 50개로 증가
- **영화 목록 다양성**: 상위 100개에서 랜덤 50개 선택 + 셔플
- **텍스트 정렬**: 섹션 타이틀 한 줄 배치, 영화 카드 중앙 정렬

### Fixed
- **Redis 프로덕션 연결**: `REDIS_URL` 환경변수 지원 (`aioredis.from_url()`)
- **무한스크롤 중단 버그**: callback ref 패턴으로 IntersectionObserver 재구현
- **콘솔 에러**:
  - `manifest.json` 404 → 파일 생성
  - `apple-mobile-web-app-capable` deprecated → `mobile-web-app-capable` 사용
  - `icon-192.png` 404 → icons 배열을 빈 배열로 설정

### Technical Details
- `backend/app/services/llm.py` - Claude API 호출 서비스
- `backend/app/api/v1/llm.py` - 캐치프레이즈 API 엔드포인트
- `backend/app/schemas/llm.py` - CatchphraseResponse 스키마
- `frontend/hooks/useInfiniteScroll.ts` - callback ref 패턴으로 전면 개선

---

## [2026-02-03]

### Added
- **프로덕션 배포**
  - Vercel (Frontend): https://jnsquery-reflix.vercel.app
  - Railway (Backend): https://backend-production-cff2.up.railway.app
  - Railway PostgreSQL + Redis
- GitHub 저장소: https://github.com/sky1522/recflix
- 데이터베이스 마이그레이션: 32,625편 영화

### Fixed
- CORS_ORIGINS 파싱: `field_validator`로 comma-separated 문자열 파싱
- DB 테이블 자동 생성: FastAPI `lifespan` 이벤트 사용
- Railway PORT 변수: `sh -c` 래퍼로 환경변수 확장

---

## [2026-02-02]

### Added
- Phase 1-8 기본 기능 구현 완료
- 하이브리드 추천 엔진 (MBTI 35% + 날씨 25% + 개인취향 40%)
- 반응형 모바일 최적화
- 검색 자동완성
- 무한 스크롤

---

## 개발 일지

자세한 개발 일지는 `docs/devlog/` 폴더에서 확인할 수 있습니다.

- [2026-02-04](docs/devlog/2026-02-04.md) - LLM 캐치프레이즈, 무한스크롤 수정, 배너 UI 개선

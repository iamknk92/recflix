# RecFlix Skills 인덱스

> 이 파일 하나로 전체 파악 → 필요한 skills 파일만 선택적으로 열기

---

## 워크플로우

| 파일 | 요약 | 핵심 |
|------|------|------|
| `deploy.md` | Vercel 배포 | `cd frontend && npx vercel --prod --yes` |
| `build-check.md` | 빌드 점검 + 캐시 오류 해결 | dev 종료 → build → 오류 시 `rm -rf .next` |
| `commit-push.md` | 커밋 타입 표 + 주의사항 | `settings.local.json` 항상 제외 |
| `save-results.md` | claude_results.txt 기록 형식 | 다음 세션: **18** (매 세션 덮어쓰기) |

---

## 패턴 참조

| 파일 | 내용 |
|------|------|
| `tanstack-query.md` | queryKey 목록, useQuery/useInfiniteQuery/useMutation 패턴 코드 |
| `hooks.md` | useDebounce / useInfiniteScroll / useWeather 사용법 |
| `movie-components.md` | MovieCard/Row 너비 패턴, 그리드 레이아웃, 디자인 토큰 표 |

---

## 프로젝트 현황 스냅샷

### 페이지 (13개)
| 경로 | 타입 | 데이터 fetch |
|------|------|-------------|
| `/` | Static | `useQuery` (TanStack) |
| `/movies` | Static | `useState/useEffect` + `useInfiniteScroll` |
| `/movies/[id]` | Dynamic | `useState/useEffect` |
| `/people/[id]` | Dynamic | `useState/useEffect` |
| `/search` | Static | `useInfiniteQuery` (TanStack) + 정렬(인기/평점/최신/오래된) |
| `/favorites` | Static | `useInfiniteQuery + useMutation` (TanStack) |
| `/ratings` | Static | `useInfiniteQuery + useMutation` (TanStack) |
| `/my-taste` | Static | `useState/useEffect` |
| `/match` | Static | `useState/useEffect` |
| `/profile` | Static | `useState/useEffect` |
| `/login` `/signup` | Static | form 전용 |
| `/offline` | Static | PWA fallback |

### 인프라
- Frontend: Next.js **14.2.35** + Vercel → https://jnsquery-reflix-eight.vercel.app
- Backend: FastAPI + Railway → https://recflix-production.up.railway.app
- GitHub: https://github.com/iamknk92/recflix.git (iamknk92)

### 빠른 명령
```bash
# 배포
cd /c/dev/recflix/frontend && npx vercel --prod --yes

# 빌드
cd /c/dev/recflix/frontend && npm run build

# dev 재시작 (build 후)
cd /c/dev/recflix/frontend && npm run dev
```

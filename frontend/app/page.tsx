"use client";

import { useEffect, useState, useMemo, useRef, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import FeaturedBanner from "@/components/movie/FeaturedBanner";
import { MovieRowSkeleton, FeaturedBannerSkeleton } from "@/components/ui/Skeleton";
import { getHomeRecommendations } from "@/lib/api";
import { useWeather } from "@/hooks/useWeather";
import { useAuthStore } from "@/stores/authStore";
import type { HomeRecommendations, MoodType } from "@/types";

// ── LazyRow: 뷰포트 진입 시에만 렌더 (Intersection Observer) ──────
function LazyRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "200px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return <div ref={ref}>{visible ? children : <MovieRowSkeleton />}</div>;
}

// ── Dynamic Imports ───────────────────────────────────────────────
// ssr: false → 스크롤 아래 컴포넌트는 클라이언트에서만 로드
// FeaturedBanner는 첫 화면에 바로 보여야 해서 static import 유지
const MovieRow = dynamic(() => import("@/components/movie/MovieRow"), {
  ssr: false,
  loading: () => <MovieRowSkeleton />,
});

const HybridMovieRow = dynamic(() => import("@/components/movie/HybridMovieRow"), {
  ssr: false,
  loading: () => <MovieRowSkeleton />,
});

const WEATHER_THEMES = ["theme-sunny", "theme-rainy", "theme-cloudy", "theme-snowy"] as const;

// ── Component ─────────────────────────────────────────────────────
export default function HomePage() {
  const [recommendations, setRecommendations] = useState<HomeRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [rowsVisible, setRowsVisible] = useState(false);

  // rows 렌더링을 낮은 우선순위로 처리 → 배너가 먼저 그려짐
  const [, startTransition] = useTransition();

  const { isAuthenticated } = useAuthStore();
  const prevAuthRef = useRef(isAuthenticated);
  const abortRef = useRef<AbortController | null>(null);

  const { weather, isManual: isManualWeather, setManualWeather, resetToRealWeather } = useWeather({
    autoFetch: true,
  });

  // ── 날씨 테마 적용 ────────────────────────────────────────────
  useEffect(() => {
    if (!weather?.condition) return;
    document.body.classList.remove(...WEATHER_THEMES);
    document.body.classList.add(`theme-${weather.condition}`);
    return () => document.body.classList.remove(...WEATHER_THEMES);
  }, [weather?.condition]);

  // ── 데이터 페칭 ──────────────────────────────────────────────
  const fetchRecommendations = useCallback(async (
    condition: string,
    currentMood: MoodType | null
  ) => {
    // 날씨/무드 빠르게 변경 시 이전 요청 취소
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setRowsVisible(false);

    try {
      const data = await getHomeRecommendations(condition, currentMood, {
        signal: abortRef.current!.signal,
      });
      setRecommendations(data);

      // 배너 먼저 표시 후 rows는 낮은 우선순위로 렌더링
      startTransition(() => setRowsVisible(true));
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError("추천 데이터를 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // weather?.condition을 변수로 추출 → 객체 참조 변경에도 재실행 방지
  const weatherCondition = weather?.condition;
  useEffect(() => {
    if (!weatherCondition) return;
    fetchRecommendations(weatherCondition, mood);
  }, [weatherCondition, mood, isAuthenticated, fetchRecommendations]);

  // ── 로그아웃 감지 ────────────────────────────────────────────
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      setRecommendations(null);
      setMood(null);
      setRowsVisible(false);
      setLoading(true);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // ── 언마운트 시 진행 중인 요청 취소 ─────────────────────────
  useEffect(() => () => abortRef.current?.abort(), []);

  // ── 배너 영화 선택 ───────────────────────────────────────────
  const featuredMovie = useMemo(() => {
    if (!recommendations) return null;
    if (isAuthenticated) {
      const first = recommendations.hybrid_row?.movies?.[0];
      if (first) return first;
    }
    return recommendations.rows?.[0]?.movies?.[0] ?? recommendations.featured ?? null;
  }, [isAuthenticated, recommendations]);

  // ── 에러 화면 ────────────────────────────────────────────────
  if (error && !recommendations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-content-muted text-sm">{error}</p>
          <button
            onClick={() => weather?.condition && fetchRecommendations(weather.condition, mood)}
            className="btn-primary px-4 py-2"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // ── 렌더링 ──────────────────────────────────────────────────
  const showBannerSkeleton = !recommendations || (loading && !featuredMovie);
  const showRowSkeleton = !rowsVisible;

  return (
    <div className="pb-24 md:pb-20">

      {/* ① 배너: 최우선 렌더 */}
      <div className="mt-2 md:mt-4">
        {showBannerSkeleton ? (
          <FeaturedBannerSkeleton />
        ) : featuredMovie ? (
          <FeaturedBanner
            movie={featuredMovie}
            weather={weather}
            onWeatherChange={setManualWeather}
            isManualWeather={isManualWeather}
            onResetWeather={resetToRealWeather}
            mood={mood}
            onMoodChange={setMood}
          />
        ) : null}
      </div>

      {/* ② Rows: useTransition으로 배너 렌더 후 낮은 우선순위로 처리 */}
      <div className="space-y-8 px-4 md:px-8 lg:px-12 mt-8">
        {showRowSkeleton ? (
          <>
            <MovieRowSkeleton />
            <MovieRowSkeleton />
            <MovieRowSkeleton />
          </>
        ) : (
          <>
            {recommendations?.hybrid_row && (
              <LazyRow>
                <HybridMovieRow
                  title={recommendations.hybrid_row.title}
                  movies={recommendations.hybrid_row.movies}
                />
              </LazyRow>
            )}
            {recommendations?.rows.map((row, idx) => (
              <LazyRow key={`${row.title}-${idx}`}>
                <MovieRow
                  title={row.title}
                  movies={row.movies}
                />
              </LazyRow>
            ))}
          </>
        )}
      </div>

    </div>
  );
}

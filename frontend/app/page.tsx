"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import FeaturedBanner from "@/components/movie/FeaturedBanner";
import { MovieRowSkeleton, FeaturedBannerSkeleton } from "@/components/ui/Skeleton";
import { getHomeRecommendations } from "@/lib/api";
import { useWeather } from "@/hooks/useWeather";
import { useAuthStore } from "@/stores/authStore";
import type { MoodType } from "@/types";

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
  const [mood, setMood] = useState<MoodType | null>(null);
  const { isAuthenticated } = useAuthStore();

  const { weather, isManual: isManualWeather, setManualWeather, resetToRealWeather } = useWeather({
    autoFetch: true,
  });

  const weatherCondition = weather?.condition;

  // ── 날씨 테마 적용 ────────────────────────────────────────────
  useEffect(() => {
    if (!weatherCondition) return;
    document.body.classList.remove(...WEATHER_THEMES);
    document.body.classList.add(`theme-${weatherCondition}`);
    return () => document.body.classList.remove(...WEATHER_THEMES);
  }, [weatherCondition]);

  // ── react-query: 같은 날씨/무드 조합은 5분간 캐시 재사용 ──────
  const { data: recommendations, isLoading, isError, refetch } = useQuery({
    queryKey: ["recommendations", weatherCondition, mood, isAuthenticated],
    queryFn: ({ signal }) => getHomeRecommendations(weatherCondition, mood, { signal }),
    enabled: !!weatherCondition,
    staleTime: 5 * 60 * 1000,
  });

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
  if (isError && !recommendations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-content-muted text-sm">추천 데이터를 불러오는데 실패했습니다.</p>
          <button
            onClick={() => refetch()}
            className="btn-primary px-4 py-2"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // ── 렌더링 ──────────────────────────────────────────────────
  const showBannerSkeleton = !recommendations || (isLoading && !featuredMovie);
  const showRowSkeleton = isLoading && !recommendations;

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

      {/* ② Rows */}
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

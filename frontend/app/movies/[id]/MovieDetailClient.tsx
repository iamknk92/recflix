"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  Heart,
  Clock,
  Calendar,
  ArrowLeft,
  Play,
  Users,
  Tag,
  Globe,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMovie, getCatchphrase, getAiSimilarMovies } from "@/lib/api";
import { getImageUrl, formatRuntime, formatDate, POSTER_BLUR_URL } from "@/lib/utils";
import { useInteractionStore } from "@/stores/interactionStore";
import { useAuthStore } from "@/stores/authStore";
import MovieCard from "@/components/movie/MovieCard";
import { Skeleton, AiMovieCardSkeleton } from "@/components/ui/Skeleton";
import type { MovieDetail, Movie, Genre } from "@/types";

type GenreItem = string | Genre;
function getGenreName(genre: GenreItem): string {
  if (typeof genre === "string") return genre;
  return genre.name_ko || genre.name;
}

export default function MovieDetailClient({ movieId }: { movieId: number }) {
  const router = useRouter();
  const [ratingHover, setRatingHover] = useState(0);

  const { isAuthenticated } = useAuthStore();
  const { interactions, fetchInteraction, toggleFavorite, setRating } =
    useInteractionStore();
  const interaction = interactions[movieId];

  const isValidId = !!movieId && !isNaN(movieId);

  // 서버에서 prefetch된 데이터가 HydrationBoundary로 주입되어 있으면
  // isLoading = false, 즉시 데이터 표시 (skeleton 노출 없음)
  const { data: movie, isLoading, isError } = useQuery<MovieDetail>({
    queryKey: ["movie", movieId],
    queryFn: () => getMovie(movieId),
    enabled: isValidId,
    staleTime: 30 * 60 * 1000,
  });

  // AI 유사 영화 — 서버 prefetch 대상 아님 (Claude API 느림, 클라이언트에서 비동기 처리)
  const aiSimilarQuery = useQuery<Movie[]>({
    queryKey: ["aiSimilarMovies", movieId],
    queryFn: () => getAiSimilarMovies(movieId),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: isValidId,
  });
  const aiSimilar = aiSimilarQuery.data ?? [];

  // 캐치프레이즈 — 서버 prefetch 대상 아님 (AI 생성, 24시간 캐시)
  const catchphraseQuery = useQuery({
    queryKey: ["catchphrase", movieId],
    queryFn: () => getCatchphrase(movieId),
    enabled: isValidId,
    retry: false,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
  const catchphrase =
    catchphraseQuery.data?.catchphrase ??
    (catchphraseQuery.isError ? (movie?.tagline ?? null) : null);

  useEffect(() => {
    if (isAuthenticated && movieId && !isNaN(movieId)) {
      fetchInteraction(movieId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, isAuthenticated]);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    try {
      await toggleFavorite(movieId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleRatingClick = async (score: number) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    try {
      await setRating(movieId, score);
    } catch (error) {
      console.error("Failed to set rating:", error);
    }
  };

  const isFavorited = interaction?.is_favorited ?? false;
  const userRating = interaction?.rating ?? 0;
  const displayRating = ratingHover || userRating;

  if (isLoading) {
    return <MovieDetailSkeleton />;
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-surface-base pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">영화 정보를 불러오는데 실패했습니다.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  const displayTitle = movie.title_ko || movie.title;
  const overview = movie.overview_ko || movie.overview;

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[60vh] md:h-[70vh]">
        <div className="absolute inset-0">
          {movie.poster_path ? (
            <Image
              src={getImageUrl(movie.poster_path, "original")}
              alt={displayTitle}
              fill
              priority
              sizes="100vw"
              placeholder="blur"
              blurDataURL={POSTER_BLUR_URL}
              className="object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-surface-raised" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/70 to-surface-base/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-base/90 via-transparent to-transparent" />
        </div>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="absolute top-4 left-4 md:left-8 z-10 flex items-center space-x-2 px-3 py-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline text-sm">뒤로</span>
        </motion.button>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-8">
            {/* Mobile Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden flex-shrink-0 w-28 sm:w-32"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                {movie.poster_path ? (
                  <Image
                    src={getImageUrl(movie.poster_path, "w342")}
                    alt={displayTitle}
                    fill
                    priority
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={POSTER_BLUR_URL}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-raised flex items-center justify-center">
                    <span className="text-4xl">🎬</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Desktop Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:block flex-shrink-0 w-64 lg:w-72"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                {movie.poster_path ? (
                  <Image
                    src={getImageUrl(movie.poster_path, "w500")}
                    alt={displayTitle}
                    fill
                    priority
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={POSTER_BLUR_URL}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-raised flex items-center justify-center">
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 md:mb-2 line-clamp-2">
                {displayTitle}
              </h1>

              {movie.title_ko && movie.title !== movie.title_ko && (
                <p className="text-gray-600 text-sm md:text-lg mb-2 md:mb-4 truncate">{movie.title}</p>
              )}

              <div className="mb-3 sm:mb-4">
                {catchphraseQuery.isLoading ? (
                  <div className="h-6 sm:h-7 w-48 sm:w-64 bg-white/20 animate-pulse rounded" />
                ) : (catchphrase || movie.tagline) && (
                  <p className="text-gray-700 italic text-sm sm:text-base md:text-lg line-clamp-2">
                    &quot;{catchphrase || movie.tagline}&quot;
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs sm:text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Star className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                  <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-gray-500 hidden sm:inline">({movie.vote_count.toLocaleString()})</span>
                </div>
                {movie.release_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{formatDate(movie.release_date)}</span>
                  </div>
                )}
                {movie.runtime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
                {movie.certification && (
                  <span className="px-1.5 md:px-2 py-0.5 border border-gray-400 rounded text-xs text-gray-600">
                    {movie.certification}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6">
                {movie.genres.slice(0, 4).map((genre, index) => {
                  const genreName = getGenreName(genre as GenreItem);
                  return (
                    <Link
                      key={genreName || index}
                      href={`/movies?genre=${encodeURIComponent(genreName)}`}
                      className="px-2 md:px-3 py-1 bg-black/10 hover:bg-black/20 rounded-full text-xs md:text-sm text-gray-800 transition"
                    >
                      {genreName}
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3">
                <button className="flex items-center space-x-1.5 md:space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-lg transition text-sm md:text-base">
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-white" />
                  <span>시청하기</span>
                </button>
                <button
                  onClick={handleFavoriteClick}
                  className={`flex items-center space-x-1.5 md:space-x-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-medium transition text-sm md:text-base ${
                    isFavorited
                      ? "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white"
                      : "bg-black/10 hover:bg-black/20 active:bg-black/30 text-gray-800"
                  }`}
                >
                  <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorited ? "fill-current" : ""}`} />
                  <span>{isFavorited ? "찜 완료" : "찜하기"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* User Rating */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-surface-card rounded-card border border-border"
            >
              <h2 className="text-lg font-semibold text-content-primary mb-4">내 평점</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleRatingClick(score)}
                      onMouseEnter={() => setRatingHover(score)}
                      onMouseLeave={() => setRatingHover(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          score <= displayRating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-content-subtle"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <span className="text-2xl font-bold text-yellow-400">
                    {userRating.toFixed(1)}
                  </span>
                )}
                {!isAuthenticated && (
                  <Link href="/login" className="text-primary-400 text-sm hover:underline">
                    로그인하고 평점 남기기
                  </Link>
                )}
              </div>
            </motion.section>

            {/* Overview */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-content-primary mb-4">줄거리</h2>
              <p className="text-content-secondary leading-relaxed text-lg">
                {overview || "줄거리 정보가 없습니다."}
              </p>
            </motion.section>

            {/* Cast */}
            {movie.cast_members && movie.cast_members.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-xl font-semibold text-content-primary mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>출연진</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {movie.cast_members.slice(0, 8).map((person) => (
                    <Link
                      key={person.id}
                      href={`/people/${person.id}`}
                      className="flex items-center space-x-3 p-3 bg-surface-raised hover:bg-surface-elevated rounded-lg transition border border-border"
                    >
                      <div className="w-10 h-10 bg-surface-elevated rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-content-subtle" />
                      </div>
                      <span className="text-content-secondary text-sm truncate">{person.name}</span>
                    </Link>
                  ))}
                </div>
              </motion.section>
            )}

            {/* AI 유사 영화 섹션 */}
            {(aiSimilarQuery.isLoading || aiSimilar.length > 0) && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-xl font-semibold text-content-primary mb-4">
                  ✨ AI가 고른 비슷한 영화
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[260px]">
                  {aiSimilarQuery.isLoading
                    ? [...Array(5)].map((_, i) => <AiMovieCardSkeleton key={i} index={i} />)
                    : aiSimilar.map((m, i) => <MovieCard key={m.id} movie={m} index={i} />)
                  }
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="p-6 bg-surface-card rounded-card border border-border space-y-4">
              <h3 className="text-lg font-semibold text-content-primary">영화 정보</h3>

              {movie.countries && movie.countries.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-content-muted text-sm mb-1">
                    <Globe className="w-4 h-4" />
                    <span>제작 국가</span>
                  </div>
                  <p className="text-content-secondary">{movie.countries.join(", ")}</p>
                </div>
              )}

              {movie.keywords && movie.keywords.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-content-muted text-sm mb-2">
                    <Tag className="w-4 h-4" />
                    <span>키워드</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {movie.keywords.slice(0, 10).map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-1 bg-surface-raised rounded text-xs text-content-muted border border-border"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-content-muted text-sm mb-1">인기도</p>
                <p className="text-content-secondary">{movie.popularity.toFixed(1)}</p>
              </div>
            </div>

            {movie.mbti_scores && Object.keys(movie.mbti_scores).length > 0 && (
              <div className="p-6 bg-surface-card rounded-card border border-border">
                <h3 className="text-lg font-semibold text-content-primary mb-4">MBTI 추천 점수</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(movie.mbti_scores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                    .map(([mbti, score]) => (
                      <div
                        key={mbti}
                        className="flex items-center justify-between p-2 bg-surface-raised rounded border border-border"
                      >
                        <span className="text-content-secondary font-medium">{mbti}</span>
                        <span className="text-primary-400">
                          {(Number(score) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {movie.weather_scores && Object.keys(movie.weather_scores).length > 0 && (
              <div className="p-6 bg-surface-card rounded-card border border-border">
                <h3 className="text-lg font-semibold text-content-primary mb-4">날씨별 추천</h3>
                <div className="space-y-2">
                  {Object.entries(movie.weather_scores)
                    .sort(([, a], [, b]) => b - a)
                    .map(([weather, score]) => {
                      const weatherEmoji: Record<string, string> = {
                        sunny: "☀️", rainy: "🌧️", cloudy: "☁️", snowy: "❄️",
                      };
                      const weatherLabel: Record<string, string> = {
                        sunny: "맑은 날", rainy: "비 오는 날", cloudy: "흐린 날", snowy: "눈 오는 날",
                      };
                      return (
                        <div
                          key={weather}
                          className="flex items-center justify-between p-2 bg-surface-raised rounded border border-border"
                        >
                          <span className="text-content-secondary">
                            {weatherEmoji[weather]} {weatherLabel[weather]}
                          </span>
                          <span className="text-blue-400">
                            {(Number(score) * 100).toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface-base">
      <div className="relative h-[50vh] md:h-[70vh]">
        <Skeleton className="absolute inset-0" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="hidden md:block w-64 lg:w-72">
              <Skeleton className="aspect-[2/3] rounded-lg" />
            </div>
            <div className="flex-1 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-12 w-32 rounded-lg" />
                <Skeleton className="h-12 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-32 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

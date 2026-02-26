"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Film, Trash2, LogIn, Calendar, Cloud } from "lucide-react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyRatings, deleteRating, getPopularMovies } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { getImageUrl } from "@/lib/utils";
import type { RatingWithMovie, Movie } from "@/types";
import MovieCard from "@/components/movie/MovieCard";
import { MovieGridSkeleton } from "@/components/ui/Skeleton";

// Weather context labels
const WEATHER_LABELS: Record<string, string> = {
  sunny: "맑은 날",
  rainy: "비 오는 날",
  cloudy: "흐린 날",
  snowy: "눈 오는 날",
};

function RatingCard({
  rating,
  onDelete,
  isDeleting,
}: {
  rating: RatingWithMovie;
  onDelete: (movieId: number) => void;
  isDeleting: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const movie = rating.movie;
  const displayTitle = movie.title_ko || movie.title;
  const year = movie.release_date?.split("-")[0];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-surface-raised rounded-lg overflow-hidden group"
    >
      <div className="flex">
        {/* Poster */}
        <Link href={`/movies/${movie.id}`} className="flex-shrink-0">
          <div className="relative w-24 sm:w-32 aspect-[2/3]">
            {movie.poster_path && !imageError ? (
              <Image
                src={getImageUrl(movie.poster_path, "w185")}
                alt={displayTitle}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-base">
                <Film className="w-8 h-8 text-content-subtle" />
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Title */}
            <Link href={`/movies/${movie.id}`}>
              <h3 className="text-content-primary font-medium text-base sm:text-lg truncate hover:text-primary-400 transition">
                {displayTitle}
              </h3>
            </Link>

            {/* Meta */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-content-subtle mt-1">
              {year && <span>{year}</span>}
              {movie.genres && movie.genres.length > 0 && (
                <>
                  <span>·</span>
                  <span className="truncate">{movie.genres.slice(0, 2).map(g => typeof g === 'string' ? g : (g as any)?.name_ko || (g as any)?.name).join(", ")}</span>
                </>
              )}
            </div>

            {/* My Rating */}
            <div className="flex items-center space-x-2 mt-3">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= rating.score
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-content-subtle"
                    }`}
                  />
                ))}
              </div>
              <span className="text-yellow-400 font-bold text-lg">
                {rating.score.toFixed(1)}
              </span>
            </div>

            {/* Date and Weather */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-content-subtle">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(rating.created_at)}</span>
              </div>
              {rating.weather_context && (
                <div className="flex items-center space-x-1">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{WEATHER_LABELS[rating.weather_context] || rating.weather_context}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <div className="flex justify-end mt-2">
            <button
              onClick={() => onDelete(movie.id)}
              disabled={isDeleting}
              className="p-2 text-content-subtle hover:text-red-500 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
              title="평점 삭제"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const PAGE_SIZE = 20;

export default function RatingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: ratingsData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["my-ratings"],
    queryFn: ({ pageParam }) => getMyRatings(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage: RatingWithMovie[], allPages) =>
      (lastPage as RatingWithMovie[]).length === PAGE_SIZE ? allPages.length + 1 : undefined,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const ratings = (ratingsData?.pages.flat() ?? []) as RatingWithMovie[];
  const totalCount = ratings.length;
  const averageScore = totalCount > 0
    ? ratings.reduce((sum, r) => sum + r.score, 0) / totalCount
    : 0;

  const { data: recommendedMovies = [] } = useQuery<Movie[]>({
    queryKey: ["popular-movies"],
    queryFn: () => getPopularMovies(12),
    enabled: isAuthenticated && !isLoading && ratings.length === 0,
    staleTime: 10 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (movieId: number) => deleteRating(movieId),
    onSuccess: (_, movieId) => {
      queryClient.setQueryData(["my-ratings"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: RatingWithMovie[]) =>
            page.filter((r) => r.movie_id !== movieId)
          ),
        };
      });
    },
  });

  const deletingId = deleteMutation.isPending ? deleteMutation.variables : null;

  const handleDelete = (movieId: number) => {
    if (!confirm("이 평점을 삭제하시겠습니까?")) return;
    deleteMutation.mutate(movieId);
  };

  // Not logged in state
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="page-container-narrow">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
              <Star className="w-12 h-12 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-content-primary mb-3">
              로그인이 필요합니다
            </h1>
            <p className="text-content-muted text-center mb-8 max-w-md">
              내 평점 목록을 보려면 로그인해주세요.<br />
              영화에 평점을 남기고 취향을 기록해보세요.
            </p>
            <Link
              href="/login"
              className="btn-primary flex items-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>로그인하기</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-narrow">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            <h1 className="text-page-heading">내 평점</h1>
          </div>
          <p className="text-content-muted">
            {isLoading ? (
              "불러오는 중..."
            ) : ratings.length > 0 ? (
              <span>
                총 <span className="text-content-primary font-medium">{totalCount}개</span> 영화 ·
                평균 <span className="text-yellow-400 font-medium">{averageScore.toFixed(1)}</span>점
              </span>
            ) : (
              "아직 평점을 남긴 영화가 없습니다"
            )}
          </p>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-surface-raised rounded-lg p-4 animate-pulse">
                  <div className="flex space-x-4">
                    <div className="w-24 sm:w-32 aspect-[2/3] bg-surface-base rounded" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-surface-base rounded w-3/4" />
                      <div className="h-4 bg-surface-base rounded w-1/2" />
                      <div className="h-6 bg-surface-base rounded w-32" />
                      <div className="h-3 bg-surface-base rounded w-40" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : ratings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-surface-raised rounded-full mb-6">
                <Star className="w-10 h-10 text-content-subtle" />
              </div>
              <h3 className="text-xl font-semibold text-content-primary mb-2">
                평점을 남긴 영화가 없습니다
              </h3>
              <p className="text-content-muted mb-8">
                영화를 보고 평점을 남겨보세요!
              </p>

              {/* Recommended movies */}
              {recommendedMovies.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-content-primary mb-4 text-left">
                    이런 영화는 어떠세요?
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {recommendedMovies.map((movie, index) => (
                      <MovieCard key={movie.id} movie={movie} index={index} />
                    ))}
                  </div>
                </div>
              )}

              <Link
                href="/movies"
                className="btn-primary inline-flex items-center space-x-2 mt-6"
              >
                <Film className="w-5 h-5" />
                <span>영화 둘러보기</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="ratings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Ratings List */}
              <div className="space-y-4">
                <AnimatePresence>
                  {ratings.map((rating) => (
                    <RatingCard
                      key={rating.id}
                      rating={rating}
                      onDelete={handleDelete}
                      isDeleting={deletingId === rating.movie_id}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn-secondary disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>불러오는 중...</span>
                      </>
                    ) : (
                      <span>더 보기</span>
                    )}
                  </button>
                </div>
              )}

              {/* End of list */}
              {!hasNextPage && ratings.length >= PAGE_SIZE && (
                <p className="text-center text-content-subtle py-8">
                  모든 평점을 불러왔습니다
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

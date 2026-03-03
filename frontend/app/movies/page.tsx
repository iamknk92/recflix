"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Film, RefreshCw } from "lucide-react";
// [수정] useQuery, useInfiniteQuery 임포트 추가
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getMovies, getGenres, getPopularMovies } from "@/lib/api";
import type { Movie, Genre } from "@/types";
import MovieCard from "@/components/movie/MovieCard";
import MovieModal from "@/components/movie/MovieModal";
import SearchAutocomplete from "@/components/search/SearchAutocomplete";
import { MovieGridSkeleton } from "@/components/ui/Skeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const SORT_OPTIONS = [
  { value: "popularity", label: "인기순" },
  { value: "vote_average", label: "평점순" },
  { value: "release_date", label: "최신순" },
];

function MoviesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const query = searchParams.get("query") || "";
  const selectedGenre = searchParams.get("genre") || "";
  const sortBy = searchParams.get("sort") || "popularity";

  // [유지] 페이지네이션 모드용 currentPage, 무한 스크롤 토글, 모달 state
  const [currentPage, setCurrentPage] = useState(1);
  const [useInfiniteMode, setUseInfiniteMode] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // [추가] 필터(query/genre/sort) 변경 시 currentPage 1로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedGenre, sortBy]);

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });

      router.push(`/movies?${params.toString()}`);
    },
    [searchParams, router]
  );

  // [수정] 2. 장르 목록 → useQuery (staleTime: Infinity — 장르는 거의 안 바뀜)
  const { data: genres = [] } = useQuery<Genre[]>({
    queryKey: ["genres"],
    queryFn: getGenres,
    staleTime: Infinity,
  });

  // [수정] 1. 영화 목록 → useQuery (페이지네이션 모드)
  // currentPage가 queryKey에 포함되어 있어 변경 시 자동 재요청
  // [수정] isError, refetch 추출 — 에러 UI 및 재시도 버튼에 사용
  const { data: movieData, isLoading: queryIsLoading, isError: queryIsError, refetch } = useQuery({
    queryKey: ["movies", query, selectedGenre, sortBy, currentPage],
    queryFn: () =>
      getMovies({
        query: query || undefined,
        genres: selectedGenre || undefined,
        page: currentPage,
        page_size: 24,
        sort_by: sortBy,
      }),
    enabled: !useInfiniteMode,
  });

  // [수정] 4. 무한 스크롤 → useInfiniteQuery
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: infiniteIsLoading,
  } = useInfiniteQuery({
    queryKey: ["movies-infinite", query, selectedGenre, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      getMovies({
        query: query || undefined,
        genres: selectedGenre || undefined,
        page: pageParam as number,
        page_size: 24,
        sort_by: sortBy,
      }),
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.total_pages ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: useInfiniteMode,
  });

  // [추가] 에러 상태 — 페이지네이션 모드일 때만 판단 (무한 스크롤은 별도 처리)
  const isError = !useInfiniteMode && queryIsError;

  // [수정] 파생 데이터 — 모드에 따라 소스 선택
  const movies = useInfiniteMode
    ? (infiniteData?.pages.flatMap((p) => p.items) ?? [])
    : (movieData?.items ?? []);
  const totalPages = useInfiniteMode
    ? (infiniteData?.pages[0]?.total_pages ?? 1)
    : (movieData?.total_pages ?? 1);
  // [수정] 6. loading/loadingMore → isLoading, isFetchingNextPage
  const isLoading = useInfiniteMode ? infiniteIsLoading : queryIsLoading;

  // [수정] 3. 추천 영화 → useQuery (검색 결과 없을 때만 활성화)
  const { data: recommendedMovies = [] } = useQuery<Movie[]>({
    queryKey: ["popularMovies"],
    queryFn: () => getPopularMovies(12),
    enabled: movies.length === 0 && !!query && !isLoading,
    staleTime: 5 * 60 * 1000,
  });

  // [수정] 무한 스크롤: loadMore 대신 fetchNextPage 직접 사용
  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
    enabled: useInfiniteMode,
  });

  const handleMovieSelect = (movieId: number) => {
    const movie = movies.find((m) => m.id === movieId);
    if (movie) {
      setSelectedMovie(movie);
    }
  };

  return (
    <div className="page-container-narrow">
      <div className="max-w-7xl mx-auto">
        {/* Search & Filters */}
        <div className="mb-8">
          <h1 className="text-page-heading mb-6">영화 검색</h1>

          {/* Search Autocomplete */}
          <div className="mb-6">
            <SearchAutocomplete
              onMovieSelect={handleMovieSelect}
              placeholder="영화 제목, 배우, 감독을 검색하세요..."
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => updateParams({ genre: e.target.value })}
              className="px-4 py-2.5 bg-surface-raised border border-border rounded-lg text-content-primary focus:outline-none focus:border-primary-500 transition"
            >
              <option value="">모든 장르</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.name_ko || genre.name}>
                  {genre.name_ko || genre.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="px-4 py-2.5 bg-surface-raised border border-border rounded-lg text-content-primary focus:outline-none focus:border-primary-500 transition"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Infinite scroll toggle */}
            <button
              onClick={() => setUseInfiniteMode(!useInfiniteMode)}
              className={`px-4 py-2.5 rounded-lg transition flex items-center space-x-2 ${
                useInfiniteMode
                  ? "bg-primary-600 text-white"
                  : "bg-surface-raised text-content-muted hover:bg-surface-elevated border border-border"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>무한 스크롤</span>
            </button>

            {/* Clear Filters */}
            {(query || selectedGenre) && (
              <button
                onClick={() => router.push("/movies")}
                className="btn-secondary px-4 py-2.5"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* Active search query indicator */}
          {query && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center space-x-2"
            >
              <span className="text-content-muted">검색어:</span>
              <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm">
                &quot;{query}&quot;
              </span>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {/* [추가] 에러 상태 UI */}
          {isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <p className="text-4xl mb-4">⚠️</p>
              <h3 className="text-xl font-semibold text-content-primary mb-2">
                영화 목록을 불러오지 못했어요
              </h3>
              <p className="text-content-muted mb-6">네트워크 상태를 확인하고 다시 시도해주세요.</p>
              <button
                onClick={() => refetch()}
                className="btn-primary px-6 py-2.5"
              >
                다시 시도
              </button>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MovieGridSkeleton count={24} />
            </motion.div>
          ) : movies.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-surface-raised rounded-full mb-6">
                <Film className="w-10 h-10 text-content-subtle" />
              </div>
              <h3 className="text-xl font-semibold text-content-primary mb-2">
                검색 결과가 없습니다
              </h3>
              <p className="text-content-muted mb-8">
                {query
                  ? `"${query}"에 대한 검색 결과를 찾을 수 없습니다.`
                  : "조건에 맞는 영화가 없습니다."}
              </p>

              {/* Recommended movies when no results */}
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
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movies.map((movie, index) => (
                  <MovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </div>

              {/* Infinite scroll mode */}
              {useInfiniteMode ? (
                <>
                  {/* [수정] loadingMore → isFetchingNextPage */}
                  {isFetchingNextPage && (
                    <div className="flex justify-center items-center py-8">
                      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Intersection observer target */}
                  <div ref={loadMoreRef} className="h-10" />

                  {/* End of results */}
                  {!hasNextPage && movies.length > 0 && (
                    <p className="text-center text-content-subtle py-8">
                      모든 영화를 불러왔습니다
                    </p>
                  )}
                </>
              ) : (
                /* Pagination */
                totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-12">
                    {/* [수정] fetchPage 중복 함수 제거 — setCurrentPage만으로 useQuery 자동 재요청 */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-surface-raised hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed text-content-primary rounded-lg transition"
                    >
                      이전
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            // [수정] fetchPage 중복 함수 제거 — setCurrentPage만으로 useQuery 자동 재요청
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg transition ${
                              currentPage === pageNum
                                ? "bg-primary-600 text-white"
                                : "bg-surface-raised text-content-muted hover:bg-surface-elevated"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* [수정] fetchPage 중복 함수 제거 */}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-surface-raised hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed text-content-primary rounded-lg transition"
                    >
                      다음
                    </button>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      )}
    </div>
  );
}

// Loading fallback for Suspense
function MoviesPageLoading() {
  return (
    <div className="page-container-narrow">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-10 w-48 bg-surface-raised rounded animate-pulse mb-6" />
          <div className="h-12 w-full bg-surface-raised rounded-lg animate-pulse mb-6" />
          <div className="flex gap-4">
            <div className="h-10 w-32 bg-surface-raised rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-surface-raised rounded-lg animate-pulse" />
          </div>
        </div>
        <MovieGridSkeleton count={24} />
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<MoviesPageLoading />}>
      <MoviesPageContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Film, User } from "lucide-react";
import { motion } from "framer-motion";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getMovies, searchAutocomplete } from "@/lib/api";
import type { Movie } from "@/types";
import MovieCard from "@/components/movie/MovieCard";
import { MovieGridSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(q);

  const {
    data: moviesData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["search-movies", q],
    queryFn: ({ pageParam }) =>
      getMovies({ query: q, page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.page < lastPage.total_pages ? allPages.length + 1 : undefined,
    enabled: !!q,
    staleTime: 2 * 60 * 1000,
  });

  const { data: autocomplete } = useQuery({
    queryKey: ["search-autocomplete", q],
    queryFn: () => searchAutocomplete(q, 5),
    enabled: !!q,
    staleTime: 2 * 60 * 1000,
  });

  const movies = (moviesData?.pages.flatMap((p) => p.items) ?? []) as Movie[];
  const totalCount = moviesData?.pages[0]?.total ?? 0;
  const people = autocomplete?.people ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  return (
    <div className="page-container-narrow">
      <div className="max-w-7xl mx-auto">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="영화, 배우, 감독을 검색하세요..."
              className="w-full pl-12 pr-4 py-4 bg-surface-card border border-border rounded-xl text-content-primary placeholder-content-muted focus:outline-none focus:border-primary-500 transition text-lg"
              autoFocus={!q}
            />
          </div>
        </form>

        {!q ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-content-subtle mx-auto mb-4" />
            <p className="text-content-muted text-lg">검색어를 입력해주세요</p>
          </div>
        ) : (
          <>
            {/* People section */}
            {people.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-content-primary mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  배우/감독
                </h2>
                <div className="flex flex-wrap gap-2">
                  {people.map((person) => (
                    <Link
                      key={person.id}
                      href={`/movies?query=${encodeURIComponent(person.name)}`}
                      className="flex items-center gap-2 px-4 py-2 bg-surface-card border border-border rounded-full hover:border-primary-500 hover:bg-primary-500/5 transition"
                    >
                      <User className="w-4 h-4 text-content-muted" />
                      <span className="text-content-primary text-sm">{person.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Movies section */}
            <section>
              <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
                <Film className="w-5 h-5" />
                영화
                {!isLoading && (
                  <span className="text-content-muted font-normal text-base">
                    ({totalCount.toLocaleString()}건)
                  </span>
                )}
              </h2>

              {isLoading ? (
                <MovieGridSkeleton count={12} />
              ) : movies.length === 0 ? (
                <div className="text-center py-16">
                  <Film className="w-12 h-12 text-content-subtle mx-auto mb-3" />
                  <p className="text-content-muted">
                    &quot;{q}&quot;에 대한 검색 결과가 없습니다
                  </p>
                  <p className="text-content-subtle text-sm mt-1">
                    다른 키워드로 검색해보세요
                  </p>
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  >
                    {movies.map((movie, index) => (
                      <MovieCard key={movie.id} movie={movie} index={index} />
                    ))}
                  </motion.div>

                  {hasNextPage && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="btn-secondary disabled:opacity-50 flex items-center gap-2"
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
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Film, User, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getMovies, searchAutocomplete } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Movie } from "@/types";
import MovieCard from "@/components/movie/MovieCard";
import { MovieGridSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

const SORT_OPTIONS = [
  { label: "인기순", sort_by: "popularity",     sort_order: "desc" },
  { label: "평점순", sort_by: "weighted_score", sort_order: "desc" },
  { label: "최신순", sort_by: "release_date",   sort_order: "desc" },
  { label: "오래된 순", sort_by: "release_date", sort_order: "asc"  },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["label"];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(q);
  const [sortLabel, setSortLabel] = useState<SortKey>("인기순");

  const currentSort = SORT_OPTIONS.find((o) => o.label === sortLabel)!;

  const {
    data: moviesData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["search-movies", q, currentSort.sort_by, currentSort.sort_order],
    queryFn: ({ pageParam }) =>
      getMovies({
        query: q,
        page: pageParam as number,
        page_size: 20,
        sort_by: currentSort.sort_by,
        sort_order: currentSort.sort_order,
      }),
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

  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    enabled: !!q,
  });

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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {people.map((person) => (
                    <Link
                      key={person.id}
                      href={`/people/${person.id}`}
                      className="flex items-center gap-3 p-3 bg-surface-card border border-border rounded-xl hover:border-primary-500 hover:bg-primary-500/5 transition group"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/10 transition">
                        <User className="w-5 h-5 text-content-muted group-hover:text-primary-500 transition" />
                      </div>
                      <span className="text-content-primary text-sm font-medium truncate">{person.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Movies section */}
            <section>
              {/* Header: 제목 + 정렬 */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
                  <Film className="w-5 h-5" />
                  영화
                  {!isLoading && (
                    <span className="text-content-muted font-normal text-base">
                      ({totalCount.toLocaleString()}건)
                    </span>
                  )}
                </h2>

                {/* Sort buttons */}
                {movies.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="w-4 h-4 text-content-muted" />
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSortLabel(opt.label)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          sortLabel === opt.label
                            ? "bg-primary-500 text-white"
                            : "bg-surface-raised text-content-muted hover:bg-surface-elevated hover:text-content-secondary"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                    key={`${q}-${sortLabel}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  >
                    {movies.map((movie, index) => (
                      <MovieCard key={movie.id} movie={movie} index={index} />
                    ))}
                  </motion.div>

                  {/* Infinite scroll trigger */}
                  <div ref={loadMoreRef} className="h-4" />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
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

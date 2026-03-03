// 서버 컴포넌트 — 'use client' 없음
// getMovie만 prefetch (AI 쿼리는 느리므로 클라이언트에서 비동기 처리)
// MovieDetailClient가 useQuery 호출 시 isLoading=false, 즉시 영화 데이터 표시

import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getMovie } from "@/lib/api";
import MovieDetailClient from "./MovieDetailClient";

export default async function MovieDetailPage({ params }: { params: { id: string } }) {
  const movieId = Number(params.id);
  const queryClient = new QueryClient();

  if (!isNaN(movieId) && movieId > 0) {
    // 서버에서 영화 상세 prefetch — 실패해도 클라이언트에서 재시도
    await queryClient.prefetchQuery({
      queryKey: ["movie", movieId],
      queryFn: () => getMovie(movieId),
      staleTime: 30 * 60 * 1000,
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MovieDetailClient movieId={movieId} />
    </HydrationBoundary>
  );
}

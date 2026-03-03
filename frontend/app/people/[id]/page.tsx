// 서버 컴포넌트 — 'use client' 없음
// getPerson을 서버에서 prefetch → HydrationBoundary로 클라이언트 캐시에 주입
// PersonClient가 useQuery 호출 시 isLoading=false, 즉시 데이터 표시

import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getPerson } from "@/lib/api";
import PersonClient from "./PersonClient";

export default async function PersonPage({ params }: { params: { id: string } }) {
  const personId = Number(params.id);
  const queryClient = new QueryClient();

  if (!isNaN(personId) && personId > 0) {
    // 서버에서 미리 fetch — 실패해도 클라이언트에서 재시도
    await queryClient.prefetchQuery({
      queryKey: ["person", personId],
      queryFn: () => getPerson(personId),
      staleTime: 30 * 60 * 1000,
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PersonClient personId={personId} />
    </HydrationBoundary>
  );
}

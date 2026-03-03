"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // 기본 5분 — 페이지별로 개별 override
            gcTime: 30 * 60 * 1000,     // 30분 — staleTime보다 충분히 길게 (캐시 재사용)
            retry: 1,
            refetchOnWindowFocus: false, // 탭 전환 시 불필요한 재요청 방지
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

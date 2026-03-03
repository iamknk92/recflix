# tanstack-query — TanStack Query 패턴

## 설정
- 파일: `frontend/app/providers.tsx`
- staleTime: 5분, gcTime: 10분, retry: 1
- 앱 전체 `<Providers>`로 감싸짐 (`layout.tsx`)

## 적용 현황 (2026-02-26)
| 파일 | 방식 | 상태 |
|------|------|------|
| `app/page.tsx` | `useQuery` | ✅ 적용 |
| `app/favorites/page.tsx` | `useInfiniteQuery + useMutation` | ✅ 적용 |
| `app/ratings/page.tsx` | `useInfiniteQuery + useMutation` | ✅ 적용 |
| `app/search/page.tsx` | `useInfiniteQuery + useQuery` | ✅ 적용 |
| `app/movies/[id]/page.tsx` | `useState/useEffect` | ❌ 미적용 |

## queryKey 목록
| queryKey | 용도 |
|----------|------|
| `["recommendations", weather, mood, isAuth]` | 홈 추천 |
| `["favorites"]` | 찜 목록 |
| `["my-ratings"]` | 내 평점 목록 |
| `["search-movies", q]` | 검색 결과 영화 |
| `["search-autocomplete", q]` | 검색 자동완성 |
| `["popular-movies"]` | 인기 영화 (빈 상태 추천용) |

## 패턴별 사용법

### useQuery (단일 fetch)
```tsx
const { data, isLoading, isError } = useQuery({
  queryKey: ["key", param],
  queryFn: () => fetchFn(param),
  enabled: !!param,
  staleTime: 5 * 60 * 1000,
});
```

### useInfiniteQuery (더 보기 버튼 방식)
```tsx
const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
  useInfiniteQuery({
    queryKey: ["favorites"],
    queryFn: ({ pageParam }) => getFavorites(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
const items = (data?.pages.flat() ?? []) as Item[];
```

### useMutation (삭제/수정 → 로컬 캐시 즉시 반영)
```tsx
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (id: number) => deleteItem(id),
  onSuccess: (_, id) => {
    queryClient.setQueryData(["favorites"], (old: any) => ({
      ...old,
      pages: old.pages.map((page: Item[]) => page.filter(i => i.id !== id)),
    }));
  },
});
// 진행 중인 항목 추적 (별도 state 불필요)
const pendingId = mutation.isPending ? mutation.variables : null;
```

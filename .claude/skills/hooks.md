# hooks — 커스텀 훅 정리

위치: `frontend/hooks/`

---

## useDebounce
```ts
useDebounce<T>(value: T, delay: number = 300): T
```
- 값 변경 후 delay ms 뒤에 업데이트
- **사용처**: `SearchAutocomplete.tsx` (타이핑 300ms 후 API 호출)

---

## useInfiniteScroll
```ts
useInfiniteScroll({
  onLoadMore,  // 뷰포트 진입 시 호출
  hasMore,
  isLoading,
  enabled?: boolean,
  threshold?: number,    // 기본 0.1
  rootMargin?: string,   // 기본 "200px" (미리 로드)
}): { loadMoreRef }
```
- Intersection Observer 기반, stale closure 방지 (`useRef` 사용)
- `loadMoreRef`를 트리거 div에 부착하면 자동 감지
- **사용처**: `movies/page.tsx` (영화 목록 무한 스크롤)

```tsx
// 사용 예
const { loadMoreRef } = useInfiniteScroll({ onLoadMore: fetchMore, hasMore, isLoading });
// ...
<div ref={loadMoreRef} />  {/* 목록 맨 끝에 배치 */}
```

---

## useWeather
```ts
useWeather(options?: { autoFetch?: boolean; defaultCity?: string }): {
  weather, loading, error, isManual,
  fetchWeather, fetchWeatherByCity,
  setManualWeather, resetToRealWeather
}
```
- 캐시: `localStorage("recflix_weather")`, 유효시간 30분
- 우선순위: 캐시 → Geolocation API → 기본 도시(Seoul) 폴백
- `setManualWeather(condition)`: 가상 날씨 설정 (캐시 안 함)
- **사용처**: `app/page.tsx` (홈 날씨 기반 추천)

### 날씨 타입별 기본 기온
| condition | 기온 | 계절 |
|-----------|------|------|
| sunny | 15°C | 봄 |
| rainy | 28°C | 여름 |
| cloudy | 12°C | 가을 |
| snowy | -3°C | 겨울 |

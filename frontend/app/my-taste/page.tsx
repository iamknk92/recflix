"use client"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { fetchRatingStats, getAiPickRecommendations } from "@/lib/api"
import { RatingStats, Movie } from "@/types"
import { useAuthStore } from "@/stores/authStore"
import StatsSummaryCards from "@/components/stats/StatsSummaryCards"
import TopCreatorsSection from "@/components/stats/TopCreatorsSection"
import MovieCard from "@/components/movie/MovieCard"

// recharts 번들을 초기 로드에서 분리 → TBT/LCP 개선
const ChartSkeleton = ({ className }: { className: string }) => (
  <div className={`bg-surface-card rounded-xl animate-pulse ${className}`} />
)
const GenreDonutChart = dynamic(() => import("@/components/stats/GenreDonutChart"), {
  ssr: false,
  loading: () => <ChartSkeleton className="h-80" />,
})
const ScoreBarChart = dynamic(() => import("@/components/stats/ScoreBarChart"), {
  ssr: false,
  loading: () => <ChartSkeleton className="h-80" />,
})
const WeatherRadarChart = dynamic(() => import("@/components/stats/WeatherRadarChart"), {
  ssr: false,
  loading: () => <ChartSkeleton className="h-96" />,
})

const MIN_RATINGS_FOR_ANALYSIS = 5

export default function MyTastePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  // [수정] isError 추출 — 네트워크 에러와 "평점 0개" 상태 구분
  const { data: stats, isLoading, isError: statsError, refetch: refetchStats } = useQuery<RatingStats>({
    // [수정] user?.id 추가 — 다른 계정 로그인 시 이전 유저 캐시 노출 방지
    queryKey: ["rating-stats", user?.id],
    queryFn: fetchRatingStats,
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000,  // 1분 — 평점 직후 빠른 반영
    gcTime: 5 * 60 * 1000,
  })

  // [추가] totalRated — aiPick enabled 조건에 사용
  const totalRated = stats?.total_rated ?? 0

  // [추가] AI 취향 추천 → useQuery (로그인 + 평점 5개 이상일 때만 호출)
  const aiPickQuery = useQuery<Movie[]>({
    // [수정] user?.id 추가 — 다른 계정 로그인 시 이전 유저 캐시 노출 방지
    queryKey: ["aiPick", user?.id],
    queryFn: getAiPickRecommendations,
    enabled: isAuthenticated && totalRated >= MIN_RATINGS_FOR_ANALYSIS,
    staleTime: 30 * 60 * 1000, // 30분 — Claude API 호출 비용 최소화
    gcTime: 60 * 60 * 1000,   // 60분 — 세션 내내 캐시 유지
  })

  if (isLoading) {
    return (
      <div className="page-container-narrow">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-surface-card rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-surface-card rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="h-80 bg-surface-card rounded-xl animate-pulse" />
            <div className="h-80 bg-surface-card rounded-xl animate-pulse" />
          </div>
          <div className="h-96 bg-surface-card rounded-xl animate-pulse mb-4" />
          <div className="flex flex-col md:flex-row gap-4">
            <div className="h-52 bg-surface-card rounded-xl animate-pulse flex-1" />
            <div className="h-52 bg-surface-card rounded-xl animate-pulse flex-1" />
          </div>
        </div>
      </div>
    )
  }

  // [추가] stats 로드 에러 처리
  if (statsError) {
    return (
      <div className="page-container-narrow flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="text-6xl mb-4">⚠️</p>
          <p className="text-content-primary text-2xl font-bold mb-2">데이터를 불러오지 못했어요</p>
          <p className="text-content-muted mb-8">네트워크 상태를 확인하고 다시 시도해주세요.</p>
          <button
            onClick={() => refetchStats()}
            className="btn-primary px-8 py-3"
          >
            다시 시도
          </button>
        </motion.div>
      </div>
    )
  }

  // 비로그인
  if (!isAuthenticated) {
    return (
      <div className="page-container-narrow flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="text-6xl mb-4">🔐</p>
          <p className="text-content-primary text-2xl font-bold mb-2">로그인이 필요해요</p>
          <p className="text-content-muted mb-8">로그인하고 나만의 영화 취향을 분석해보세요!</p>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary px-8 py-3"
          >
            로그인하기
          </button>
        </motion.div>
      </div>
    )
  }

  // 로그인했지만 평점 부족
  if (totalRated < MIN_RATINGS_FOR_ANALYSIS) {
    const remaining = MIN_RATINGS_FOR_ANALYSIS - totalRated
    return (
      <div className="page-container-narrow flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="text-6xl mb-4">🎬</p>
          <p className="text-content-primary text-2xl font-bold mb-2">취향 분석 준비 중이에요</p>
          {totalRated === 0 ? (
            <p className="text-content-muted mb-3">
              영화 <span className="text-primary-500 font-semibold">5편</span> 이상 평가하면 취향 분석이 시작돼요!
            </p>
          ) : (
            <p className="text-content-muted mb-3">
              현재 <span className="text-primary-500 font-semibold">{totalRated}편</span> 평가됨 —{" "}
              <span className="text-primary-400 font-semibold">{remaining}편</span> 더 평가하면 분석이 시작돼요!
            </p>
          )}
          <div className="w-64 mx-auto bg-surface-elevated rounded-full h-2 mb-8">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${(totalRated / MIN_RATINGS_FOR_ANALYSIS) * 100}%` }}
            />
          </div>
          <button
            onClick={() => router.push("/movies")}
            className="btn-primary px-8 py-3"
          >
            영화 보러 가기
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="page-container-narrow"
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-page-heading mb-2">내 취향 분석</h1>
        <p className="text-page-desc mb-8">{user?.nickname}님의 영화 취향을 분석했어요</p>
        <StatsSummaryCards stats={stats!} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <GenreDonutChart data={stats!.genre_distribution} />
          <ScoreBarChart data={stats!.score_distribution} averageScore={stats!.average_score} />
        </div>
        <div className="mb-4">
          <WeatherRadarChart data={stats!.weather_genre_map} />
        </div>
        <TopCreatorsSection directors={stats!.top_directors} actors={stats!.top_actors} />

        {/* [추가] AI 취향 추천 섹션 — 로그인 + 평점 5개 이상일 때만 렌더링 */}
        {(aiPickQuery.isLoading || (aiPickQuery.data && aiPickQuery.data.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-xl font-bold text-content-primary mb-4">✨ AI가 고른 취향 저격 영화</h2>
            {aiPickQuery.isLoading ? (
              // 로딩 중 스켈레톤 5개 — min-h로 CLS 방지
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 min-h-[280px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-surface-card rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 min-h-[280px]">
                {aiPickQuery.data!.map((movie, i) => (
                  <MovieCard key={movie.id} movie={movie} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { fetchRatingStats } from "@/lib/api"
import { RatingStats } from "@/types"
import { useAuthStore } from "@/stores/authStore"
import StatsSummaryCards from "@/components/stats/StatsSummaryCards"
import GenreDonutChart from "@/components/stats/GenreDonutChart"
import ScoreBarChart from "@/components/stats/ScoreBarChart"
import WeatherRadarChart from "@/components/stats/WeatherRadarChart"
import TopCreatorsSection from "@/components/stats/TopCreatorsSection"

const MIN_RATINGS_FOR_ANALYSIS = 5

export default function MyTastePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    fetchRatingStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] pt-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-[#1e1e1e] rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-[#1e1e1e] rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="h-80 bg-[#1e1e1e] rounded-xl animate-pulse" />
            <div className="h-80 bg-[#1e1e1e] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // 비로그인
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#141414] pt-20 px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="text-6xl mb-4">🔐</p>
          <p className="text-white text-2xl font-bold mb-2">로그인이 필요해요</p>
          <p className="text-gray-400 mb-8">로그인하고 나만의 영화 취향을 분석해보세요!</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
          >
            로그인하기
          </button>
        </motion.div>
      </div>
    )
  }

  // 로그인했지만 평점 부족
  const totalRated = stats?.total_rated ?? 0
  if (totalRated < MIN_RATINGS_FOR_ANALYSIS) {
    const remaining = MIN_RATINGS_FOR_ANALYSIS - totalRated
    return (
      <div className="min-h-screen bg-[#141414] pt-20 px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="text-6xl mb-4">🎬</p>
          <p className="text-white text-2xl font-bold mb-2">취향 분석 준비 중이에요</p>
          {totalRated === 0 ? (
            <p className="text-gray-400 mb-3">
              영화 <span className="text-red-400 font-semibold">5편</span> 이상 평가하면 취향 분석이 시작돼요!
            </p>
          ) : (
            <p className="text-gray-400 mb-3">
              현재 <span className="text-red-400 font-semibold">{totalRated}편</span> 평가됨 —{" "}
              <span className="text-yellow-400 font-semibold">{remaining}편</span> 더 평가하면 분석이 시작돼요!
            </p>
          )}
          <div className="w-64 mx-auto bg-zinc-800 rounded-full h-2 mb-8">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${(totalRated / MIN_RATINGS_FOR_ANALYSIS) * 100}%` }}
            />
          </div>
          <button
            onClick={() => router.push("/movies")}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
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
      className="min-h-screen bg-[#141414] pt-20 px-6 pb-16"
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-2">내 취향 분석</h1>
        <p className="text-gray-400 mb-8">{user?.nickname}님의 영화 취향을 분석했어요</p>
        <StatsSummaryCards stats={stats!} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <GenreDonutChart data={stats!.genre_distribution} />
          <ScoreBarChart data={stats!.score_distribution} averageScore={stats!.average_score} />
        </div>
        <div className="mb-4">
          <WeatherRadarChart data={stats!.weather_genre_map} />
        </div>
        <TopCreatorsSection directors={stats!.top_directors} actors={stats!.top_actors} />
      </div>
    </motion.div>
  )
}

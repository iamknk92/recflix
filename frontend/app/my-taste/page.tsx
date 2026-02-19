"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchRatingStats } from "@/lib/api"
import { RatingStats } from "@/types"
import { useAuthStore } from "@/stores/authStore"
import StatsSummaryCards from "@/components/stats/StatsSummaryCards"
import GenreDonutChart from "@/components/stats/GenreDonutChart"
import ScoreBarChart from "@/components/stats/ScoreBarChart"
import WeatherRadarChart from "@/components/stats/WeatherRadarChart"
import TopCreatorsSection from "@/components/stats/TopCreatorsSection"

export default function MyTastePage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchRatingStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

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

  if (!stats || stats.total_rated === 0) {
    return (
      <div className="min-h-screen bg-[#141414] pt-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🎬</p>
          <p className="text-white text-xl font-bold mb-2">아직 평가한 영화가 없어요</p>
          <p className="text-gray-400 mb-6">영화에 별점을 남기면 취향 분석이 시작돼요!</p>
          <button
            onClick={() => router.push("/movies")}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            영화 보러 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#141414] pt-20 px-6 pb-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-2">내 취향 분석</h1>
        <p className="text-gray-400 mb-8">{user?.nickname}님의 영화 취향을 분석했어요</p>
        <StatsSummaryCards stats={stats} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <GenreDonutChart data={stats.genre_distribution} />
          <ScoreBarChart data={stats.score_distribution} averageScore={stats.average_score} />
        </div>
        <div className="mb-4">
          <WeatherRadarChart data={stats.weather_genre_map} />
        </div>
        <TopCreatorsSection directors={stats.top_directors} actors={stats.top_actors} />
      </div>
    </div>
  )
}

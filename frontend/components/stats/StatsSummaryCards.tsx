"use client"
import { RatingStats } from "@/types"

interface Props {
  stats: RatingStats
}

export default function StatsSummaryCards({ stats }: Props) {
  const topGenre =
    Object.entries(stats.genre_distribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-"

  const cards = [
    { icon: "🎬", label: "평가한 영화", value: `${stats.total_rated}편` },
    { icon: "❤️", label: "찜한 영화", value: `${stats.total_favorites}편` },
    { icon: "⭐", label: "평균 별점", value: `${stats.average_score}점` },
    { icon: "🎭", label: "최다 장르", value: topGenre },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="card p-5 flex flex-col gap-2">
          <span className="text-3xl">{card.icon}</span>
          <span className="text-2xl font-bold text-content-primary">{card.value}</span>
          <span className="text-sm text-content-muted">{card.label}</span>
        </div>
      ))}
    </div>
  )
}

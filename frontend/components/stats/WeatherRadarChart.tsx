"use client"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface Props {
  data: Record<string, Record<string, number>>
}

const WEATHER_LABEL: Record<string, string> = {
  sunny: "☀️ 맑음",
  rainy: "🌧️ 비",
  cloudy: "☁️ 흐림",
  snowy: "❄️ 눈",
}
const COLORS = ["#4d96ff", "#ffd93d", "#95a5a6", "#e8f4f8"]

export default function WeatherRadarChart({ data }: Props) {
  if (Object.keys(data).length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-content-primary font-bold text-lg mb-4">🌤️ 날씨별 장르 취향</h3>
        <div className="text-center text-content-subtle py-10">날씨 기록이 쌓이면 보여드릴게요 🌤️</div>
      </div>
    )
  }

  const allGenres = Array.from(new Set(Object.values(data).flatMap((g) => Object.keys(g))))
  const chartData = allGenres.map((genre) => {
    const entry: Record<string, string | number> = { genre }
    Object.entries(data).forEach(([weather, genres]) => {
      entry[WEATHER_LABEL[weather] ?? weather] = genres[genre] ?? 0
    })
    return entry
  })
  const weatherKeys = Object.keys(data).map((w) => WEATHER_LABEL[w] ?? w)

  return (
    <div className="card p-6">
      <h3 className="text-content-primary font-bold text-lg mb-4">🌤️ 날씨별 장르 취향</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="genre" tick={{ fill: "#aaa", fontSize: 12 }} />
          {weatherKeys.map((key, i) => (
            <Radar key={key} name={key} dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
          ))}
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts"

interface Props {
  data: Record<string, number>
}

const COLORS = ["#e50914", "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff"]

export default function GenreDonutChart({ data }: Props) {
  const chartData = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
  const topGenre = chartData[0]?.name ?? ""

  if (chartData.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-48">
        <p className="text-content-subtle">장르 데이터가 없어요</p>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="text-content-primary font-bold text-lg mb-4">🎭 장르 선호도</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}편`, ""]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {topGenre && (
        <p className="text-center text-content-secondary mt-2 text-sm">
          당신은 <span className="text-red-400 font-bold">{topGenre}</span> 마니아예요!
        </p>
      )}
    </div>
  )
}

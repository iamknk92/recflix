"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Props {
  data: Record<string, number>
  averageScore: number
}

export default function ScoreBarChart({ data, averageScore }: Props) {
  const chartData = Object.entries(data)
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([score, count]) => ({ score, count }))

  const tendency =
    averageScore >= 4.0 ? "후한 편이에요 😊"
    : averageScore <= 2.5 ? "까다로운 편이에요 🧐"
    : "보통이에요 😐"

  return (
    <div className="bg-[#1e1e1e] rounded-xl p-6">
      <h3 className="text-white font-bold text-lg mb-1">⭐ 별점 분포</h3>
      <p className="text-gray-400 text-sm mb-4">
        평점을 주는 스타일이 <span className="text-yellow-400">{tendency}</span>
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <XAxis dataKey="score" stroke="#888" tick={{ fill: "#aaa", fontSize: 12 }} />
          <YAxis stroke="#888" tick={{ fill: "#aaa", fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value}편`, "횟수"]} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill="#e50914" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

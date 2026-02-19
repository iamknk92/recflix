"use client"

interface Props {
  directors: string[]
  actors: string[]
}

const MEDALS = ["🥇", "🥈", "🥉"]

export default function TopCreatorsSection({ directors, actors }: Props) {
  const renderList = (items: string[], label: string) => (
    <div className="bg-[#1e1e1e] rounded-xl p-6 flex-1">
      <h3 className="text-white font-bold text-lg mb-4">{label}</h3>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">아직 데이터가 부족해요</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((name, i) => (
            <li key={name} className="flex items-center gap-3">
              <span className="text-2xl">{MEDALS[i]}</span>
              <span className="text-white font-medium">{name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {renderList(directors, "🎬 자주 본 감독")}
      {renderList(actors, "🎭 자주 본 배우")}
    </div>
  )
}

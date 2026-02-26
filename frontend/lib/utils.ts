// 포스터(2:3) 로딩 전 blur placeholder — 아이보리 테마 배경색
const _posterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="3"><rect width="2" height="3" fill="#EDE8E1"/></svg>`;
export const POSTER_BLUR_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(_posterSvg)}`;

export function getImageUrl(path: string | null | undefined, size: string = "w500"): string {
  if (!path) return "/placeholder.png"
  if (path.startsWith("http")) return path
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export function getMBTIColor(mbti: string | null | undefined): string {
  const colors: Record<string, string> = {
    INTJ: "bg-purple-700", INTP: "bg-purple-500",
    ENTJ: "bg-red-700",   ENTP: "bg-red-500",
    INFJ: "bg-teal-700",  INFP: "bg-teal-500",
    ENFJ: "bg-green-700", ENFP: "bg-green-500",
    ISTJ: "bg-blue-700",  ISFJ: "bg-blue-500",
    ESTJ: "bg-orange-700",ESFJ: "bg-orange-500",
    ISTP: "bg-gray-700",  ISFP: "bg-gray-500",
    ESTP: "bg-yellow-700",ESFP: "bg-yellow-500",
  }
  return mbti ? (colors[mbti] ?? "bg-gray-600") : "bg-gray-600"
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return ""
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

export function formatScore(score: number | null | undefined): string {
  if (!score) return "0.0"
  return score.toFixed(1)
}

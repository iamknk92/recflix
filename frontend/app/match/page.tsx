"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Users, Search, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { getMatchRecommendations, type MatchResponse } from "@/lib/api";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const AXES = [
  ["E", "I"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"],
] as const;

function MbtiToggle({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const axes = value.split("");

  const toggle = (axisIndex: number) => {
    const newAxes = [...axes];
    const [a, b] = AXES[axisIndex];
    newAxes[axisIndex] = newAxes[axisIndex] === a ? b : a;
    onChange(newAxes.join(""));
  };

  return (
    <div>
      <p className="text-content-secondary text-sm font-semibold mb-3">{label}</p>
      <div className="flex gap-2">
        {AXES.map(([a, b], i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-badge transition shadow-sm ${
                axes[i] === a
                  ? "bg-primary-600 text-white"
                  : "bg-surface-raised text-content-muted border border-border"
              }`}
            >
              {a}
            </span>
            <span className="text-content-subtle text-[10px]">|</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-badge transition ${
                axes[i] === b
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-surface-raised text-content-muted border border-border"
              }`}
            >
              {b}
            </span>
          </button>
        ))}
      </div>
      <p className="text-primary-700 font-bold text-2xl mt-3 tracking-tight">{value}</p>
    </div>
  );
}

function CompatibilityRing({ score }: { score: number }) {
  const color =
    score >= 80
      ? "#a855f7"
      : score >= 60
      ? "#818cf8"
      : score >= 40
      ? "#60a5fa"
      : "#94a3b8";

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112">
        <circle cx="56" cy="56" r={radius} stroke="#F5F1EC" strokeWidth="8" fill="none" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="text-xl font-bold text-primary-900">{score}</span>
    </div>
  );
}

const POSTER_BASE = "https://image.tmdb.org/t/p/w300";

export default function MatchPage() {
  const { user, isAuthenticated } = useAuthStore();

  const [myMbti, setMyMbti] = useState<string>(user?.mbti || "INFP");
  const [friendMbti, setFriendMbti] = useState<string>("ENFJ");
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!MBTI_TYPES.includes(myMbti) || !MBTI_TYPES.includes(friendMbti)) {
      setError("유효하지 않은 MBTI입니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMatchRecommendations(myMbti, friendMbti, 10);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    result && result.compatibility.score >= 80
      ? "text-purple-400"
      : result && result.compatibility.score >= 60
      ? "text-indigo-400"
      : "text-blue-400";

  return (
    <div className="page-container-narrow">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-primary-400" />
            <h1 className="text-2xl font-bold text-content-primary">MBTI 궁합 추천</h1>
          </div>
          <p className="text-content-muted text-sm">
            두 MBTI의 궁합을 분석하고, 둘 다 좋아할 영화를 추천해요
          </p>
        </motion.div>

        {/* MBTI Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* My MBTI */}
            <div>
              <MbtiToggle
                value={myMbti}
                onChange={setMyMbti}
                label={isAuthenticated ? `내 MBTI (${user?.nickname || "나"})` : "나의 MBTI"}
              />
              {!isAuthenticated && (
                <p className="text-content-subtle text-xs mt-2">
                  로그인하면 내 MBTI가 자동으로 설정돼요
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:flex items-center justify-center">
              <div className="h-full w-px bg-border" />
            </div>

            {/* Friend MBTI */}
            <MbtiToggle
              value={friendMbti}
              onChange={setFriendMbti}
              label="친구 MBTI"
            />
          </div>

          {/* Search Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-8 py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{loading ? "분석 중..." : "궁합 영화 찾기"}</span>
            </button>
          </div>

          {error && (
            <p className="text-primary-600 text-sm text-center mt-3">{error}</p>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Compatibility Card */}
              <div className="card p-6 mb-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <CompatibilityRing score={result.compatibility.score} />
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <span className="text-primary-700 font-bold text-lg">
                        {result.mbti1}
                      </span>
                      <span className="text-content-secondary">×</span>
                      <span className="text-accent-purple font-bold text-lg">
                        {result.mbti2}
                      </span>
                      <span className={`ml-2 font-bold text-lg ${scoreColor}`}>
                        {result.compatibility.score >= 80
                          ? "최고의 조합"
                          : result.compatibility.score >= 60
                          ? "좋은 조합"
                          : result.compatibility.score >= 40
                          ? "무난한 조합"
                          : "도전적인 조합"}
                      </span>
                    </div>
                    <p className="text-content-secondary text-sm leading-relaxed">
                      {result.compatibility.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Movie List */}
              <h2 className="text-content-primary font-semibold mb-4 flex items-center gap-2">
                <span>함께 보기 좋은 영화</span>
                <span className="text-content-subtle text-sm font-normal">
                  {result.movies.length}편
                </span>
              </h2>

              {result.movies.length === 0 ? (
                <div className="text-center py-12 text-content-subtle">
                  <p>추천 가능한 영화가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {result.movies.map((movie, idx) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link href={`/movies/${movie.id}`}>
                        <div className="group cursor-pointer">
                          {/* Poster */}
                          <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden mb-2 bg-surface-card shadow-sm">
                            {movie.poster_path ? (
                              <Image
                                src={`${POSTER_BASE}${movie.poster_path}`}
                                alt={movie.title_ko || movie.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-content-subtle">
                                <Star className="w-8 h-8 opacity-20" />
                              </div>
                            )}

                            {/* Match score badge */}
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                              <span className="text-primary-400 font-bold text-xs">
                                {movie.match_score}%
                              </span>
                            </div>
                          </div>

                          {/* Title */}
                          <p className="text-content-primary text-xs font-medium truncate">
                            {movie.title_ko || movie.title}
                          </p>

                          {/* Score bar */}
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1 h-1 rounded-full bg-surface-elevated overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${movie.mbti1_score}%` }}
                              />
                            </div>
                            <span className="text-content-subtle text-[10px]">|</span>
                            <div className="flex-1 h-1 rounded-full bg-surface-elevated overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${movie.mbti2_score}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-primary-400/60 text-[10px]">
                              {result.mbti1}
                            </span>
                            <span className="text-purple-400/60 text-[10px]">
                              {result.mbti2}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick MBTI Guide */}
        {!result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { pair: "INTJ × ENFP", emoji: "🔭", desc: "환상의 파트너" },
              { pair: "INFJ × ENTP", emoji: "💬", desc: "철학적 대화" },
              { pair: "INFP × ENFJ", emoji: "💕", desc: "감성 공유" },
              { pair: "ISTJ × ESFP", emoji: "⚡", desc: "반대의 매력" },
            ].map((item) => (
              <button
                key={item.pair}
                onClick={() => {
                  const [m1, m2] = item.pair.split(" × ");
                  setMyMbti(m1);
                  setFriendMbti(m2);
                }}
                className="card-interactive p-3 text-left"
              >
                <span className="text-lg">{item.emoji}</span>
                <p className="text-content-muted text-xs mt-1">{item.pair}</p>
                <p className="text-content-subtle text-xs">{item.desc}</p>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

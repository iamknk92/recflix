"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Eye } from "lucide-react";
import { getImageUrl, formatDate, POSTER_BLUR_URL } from "@/lib/utils";
import type { Movie } from "@/types";
import MovieModal from "./MovieModal";

interface MovieCardProps {
  movie: Movie;
  index?: number;
  showQuickView?: boolean;
}

export default function MovieCard({ movie, index = 0, showQuickView = true }: MovieCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="w-full group"
      >
        <Link href={`/movies/${movie.id}`}>
          {/* Poster — w-full로 부모 너비에 맞춤 */}
          <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-sm bg-surface-card">
            {!imageError && movie.poster_path ? (
              <Image
                src={getImageUrl(movie.poster_path, "w342")}
                alt={movie.title_ko || movie.title}
                fill
                className="object-cover"
                // [추가] 첫 번째 이미지만 priority (LCP 최적화), 나머지는 자동 lazy
                priority={index === 0}
                // sizes — 모바일 2열(50vw), 태블릿 3열(33vw), 데스크톱 최대 200px
                // next.config imageSizes: [160, 200, 342] 기준으로 최적 사이즈 선택됨
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                placeholder="blur"
                blurDataURL={POSTER_BLUR_URL}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-dark-100">
                <svg className="w-12 h-12 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                </svg>
              </div>
            )}

            {/* Hover overlay */}
            {/* [수정] style로 직접 강제 — Tailwind 우선순위 문제 우회 */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <div className="text-center p-4">
                {/* [수정] 별점 — style로 color, textShadow 직접 강제 */}
                <div
                  className="flex items-center justify-center space-x-1 mb-2"
                  style={{ color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,1)' }}
                >
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-medium">{movie.vote_average.toFixed(1)}</span>
                </div>
                {/* [수정] 상세보기 — style로 color, textShadow 직접 강제 */}
                <p
                  className="text-sm mb-3"
                  style={{ color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,1)' }}
                >
                  상세보기
                </p>

                {/* Quick View Button */}
                {showQuickView && (
                  <button
                    onClick={handleQuickView}
                    // [수정] style로 color, borderColor, textShadow 직접 강제
                    className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 border rounded-full text-xs font-bold transition"
                    style={{ color: '#ffffff', borderColor: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,1)' }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>미리보기</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-2 px-1 text-center">
            <h3 className="text-sm font-bold text-primary-900 truncate group-hover:text-primary-600 transition">
              {movie.title_ko || movie.title}
            </h3>
            <div className="flex items-center justify-center gap-1.5 text-xs text-content-muted mt-1">
              <span>{formatDate(movie.release_date)}</span>
              {movie.genres.length > 0 && (
                <>
                  <span>·</span>
                  <span className="truncate">
                    {typeof movie.genres[0] === "string"
                      ? movie.genres[0]
                      : (movie.genres[0] as any)?.name_ko || (movie.genres[0] as any)?.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Modal */}
      {isModalOpen && (
        <MovieModal movie={movie} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

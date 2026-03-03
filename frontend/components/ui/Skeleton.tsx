"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-surface-raised rounded ${className}`}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function MovieCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex-shrink-0 w-[140px] sm:w-[160px]"
    >
      <Skeleton className="aspect-[2/3] rounded-md" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-1 h-3 w-1/2" />
    </motion.div>
  );
}

export function MovieGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.02, duration: 0.3 }}
        >
          <Skeleton className="aspect-[2/3] rounded-md" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-1 h-3 w-1/2" />
        </motion.div>
      ))}
    </div>
  );
}

// AI 추천 섹션용 — MovieCard(w-full, aspect-[2/3], 제목, 날짜/장르)와 동일한 구조
export function AiMovieCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      {/* 포스터 영역 — MovieCard의 rounded-xl, aspect-[2/3] 일치 */}
      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
      {/* 제목 줄 */}
      <Skeleton className="mt-2 h-4 w-3/4 mx-auto" />
      {/* 날짜·장르 줄 */}
      <Skeleton className="mt-1 h-3 w-1/2 mx-auto" />
    </motion.div>
  );
}

export function MovieRowSkeleton({ count = 7 }: { count?: number }) {
  return (
    // min-h로 실제 row 높이와 일치 → CLS 방지
    <div className="flex space-x-3 overflow-hidden min-h-[230px]">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

export function FeaturedBannerSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-[50vh] md:h-[70vh] bg-surface-raised"
    >
      <Skeleton className="absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <div className="flex space-x-3">
          <Skeleton className="h-12 w-32 rounded-md" />
          <Skeleton className="h-12 w-32 rounded-md" />
        </div>
      </div>
    </motion.div>
  );
}

export function WeatherBannerSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-surface-raised"
    >
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </motion.div>
  );
}

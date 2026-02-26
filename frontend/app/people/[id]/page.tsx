"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Film, Star, Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPerson } from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";
import { Skeleton } from "@/components/ui/Skeleton";

const ROLE_LABEL: Record<string, string> = {
  actor: "배우",
  director: "감독",
};

export default function PersonPage() {
  const params = useParams();
  const router = useRouter();
  const personId = Number(params.id);

  const { data: person, isLoading, isError } = useQuery({
    queryKey: ["person", personId],
    queryFn: () => getPerson(personId),
    enabled: !!personId && !isNaN(personId),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="page-container-narrow">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-24 w-72 mb-8 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !person) {
    return (
      <div className="page-container-narrow">
        <div className="max-w-7xl mx-auto text-center py-20">
          <User className="w-16 h-16 text-content-subtle mx-auto mb-4" />
          <p className="text-content-muted text-lg">인물 정보를 찾을 수 없습니다</p>
          <button
            onClick={() => router.back()}
            className="mt-6 btn-secondary"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  const isDirector = person.roles.includes("director");
  const isActor = person.roles.includes("actor");

  return (
    <div className="page-container-narrow">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-content-muted hover:text-content-primary transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">뒤로</span>
        </button>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-10 p-6 bg-surface-card border border-border rounded-2xl"
        >
          <div className="w-20 h-20 rounded-full bg-surface-raised flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-content-subtle" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content-primary mb-2">
              {person.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {isActor && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 text-primary-600 rounded-full text-sm font-medium">
                  <Star className="w-3.5 h-3.5" />
                  {ROLE_LABEL.actor}
                </span>
              )}
              {isDirector && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium">
                  <Video className="w-3.5 h-3.5" />
                  {ROLE_LABEL.director}
                </span>
              )}
              <span className="text-content-muted text-sm">
                <Film className="w-4 h-4 inline mr-1" />
                {person.total}편
              </span>
            </div>
          </div>
        </motion.div>

        {/* Filmography */}
        <section>
          <h2 className="text-lg font-semibold text-content-primary mb-4">
            필모그래피
          </h2>
          {person.movies.length === 0 ? (
            <div className="text-center py-16">
              <Film className="w-12 h-12 text-content-subtle mx-auto mb-3" />
              <p className="text-content-muted">등록된 작품이 없습니다</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {person.movies.map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} index={index} />
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}

"""
Rating API endpoints
"""
from collections import Counter, defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_db, get_current_user
from app.models import User, Movie, Rating, Collection, collection_movies
from app.models.genre import Genre
from app.schemas import (
    RatingCreate, RatingUpdate, RatingResponse, RatingWithMovie, MovieListItem
)

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.get("/stats")
def get_rating_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """내 취향 분석 통계"""
    rows = (
        db.query(Rating, Movie)
        .join(Movie, Rating.movie_id == Movie.id)
        .options(selectinload(Movie.genres))
        .filter(Rating.user_id == current_user.id)
        .all()
    )

    if not rows:
        return {
            "total_rated": 0,
            "total_favorites": 0,
            "average_score": 0.0,
            "genre_distribution": {},
            "score_distribution": {},
            "weather_genre_map": {},
            "top_directors": [],
            "top_actors": [],
        }

    ratings_list  = [row[0] for row in rows]
    total_rated   = len(ratings_list)
    average_score = round(sum(r.score for r in ratings_list) / total_rated, 1)

    # 찜 수
    favorites = db.query(Collection).filter(
        Collection.user_id == current_user.id,
        Collection.name == "찜한 영화"
    ).first()
    total_favorites = 0
    if favorites:
        total_favorites = db.query(func.count(collection_movies.c.movie_id)).filter(
            collection_movies.c.collection_id == favorites.id
        ).scalar() or 0

    # 장르 분포
    genre_counter = Counter()
    for rating, movie in rows:
        if rating.score >= 4.0:
            for genre in movie.genres:
                genre_counter[genre.name] += 1
    if not genre_counter:
        for _, movie in rows:
            for genre in movie.genres:
                genre_counter[genre.name] += 1
    genre_distribution = dict(genre_counter.most_common(6))

    # 별점 분포
    score_counter = Counter()
    for r in ratings_list:
        score_counter[str(r.score)] += 1
    score_distribution = dict(
        sorted(score_counter.items(), key=lambda x: float(x[0]))
    )

    # 날씨별 장르 맵
    weather_genre_map = defaultdict(Counter)
    for rating, movie in rows:
        if rating.weather_context:
            for genre in movie.genres:
                weather_genre_map[rating.weather_context][genre.name] += 1
    weather_genre_result = {
        weather: dict(genres.most_common(4))
        for weather, genres in weather_genre_map.items()
    }

    # 감독 Top 3
    director_counter = Counter()
    for _, movie in rows:
        name = movie.director_ko or movie.director
        if name:
            director_counter[name] += 1
    top_directors = [n for n, _ in director_counter.most_common(3)]

    # 배우 Top 3
    actor_counter = Counter()
    for _, movie in rows:
        if movie.cast_ko:
            for actor in movie.cast_ko.split(",")[:3]:
                actor = actor.strip()
                if actor:
                    actor_counter[actor] += 1
    top_actors = [n for n, _ in actor_counter.most_common(3)]

    return {
        "total_rated": total_rated,
        "total_favorites": total_favorites,
        "average_score": average_score,
        "genre_distribution": genre_distribution,
        "score_distribution": score_distribution,
        "weather_genre_map": weather_genre_result,
        "top_directors": top_directors,
        "top_actors": top_actors,
    }


@router.get("/me", response_model=List[RatingWithMovie])
def get_my_ratings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * page_size
    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).order_by(Rating.created_at.desc()).offset(offset).limit(page_size).all()

    result = []
    for r in ratings:
        result.append(RatingWithMovie(
            id=r.id,
            user_id=r.user_id,
            movie_id=r.movie_id,
            score=r.score,
            weather_context=r.weather_context,
            created_at=r.created_at,
            movie=MovieListItem.from_orm_with_genres(r.movie)
        ))
    return result


@router.post("", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    movie = db.query(Movie).filter(Movie.id == rating_data.movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")

    existing = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == rating_data.movie_id
    ).first()

    if existing:
        existing.score = rating_data.score
        existing.weather_context = rating_data.weather_context
        db.commit()
        db.refresh(existing)
        return existing
    else:
        rating = Rating(
            user_id=current_user.id,
            movie_id=rating_data.movie_id,
            score=rating_data.score,
            weather_context=rating_data.weather_context
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
        return rating


@router.get("/{movie_id}", response_model=RatingResponse)
def get_my_rating_for_movie(
    movie_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id
    ).first()
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
    return rating


@router.put("/{movie_id}", response_model=RatingResponse)
def update_rating(
    movie_id: int,
    rating_data: RatingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id
    ).first()
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")

    rating.score = rating_data.score
    if rating_data.weather_context is not None:
        rating.weather_context = rating_data.weather_context
    db.commit()
    db.refresh(rating)
    return rating


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    movie_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id
    ).first()
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
    db.delete(rating)
    db.commit()
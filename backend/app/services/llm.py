"""
LLM Service - Anthropic Claude API Integration with Redis Caching
"""
import anthropic
import redis.asyncio as aioredis
from typing import Optional

from app.config import settings

# Redis 캐시 TTL (24시간)
CATCHPHRASE_CACHE_TTL = 86400

# Redis 클라이언트 (싱글톤)
_redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> Optional[aioredis.Redis]:
    """Redis 클라이언트 가져오기 (싱글톤)"""
    global _redis_client

    if _redis_client is not None:
        try:
            await _redis_client.ping()
            return _redis_client
        except Exception:
            _redis_client = None

    try:
        # REDIS_URL이 있으면 사용 (Railway 등 클라우드 환경)
        if settings.REDIS_URL:
            print(f"Connecting to Redis via URL...")
            _redis_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
            )
        else:
            # 로컬 개발 환경
            print(f"Connecting to Redis via host/port...")
            _redis_client = aioredis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                db=0,
                decode_responses=True,
                socket_connect_timeout=5,
            )
        await _redis_client.ping()
        print("Redis connection successful")
        return _redis_client
    except Exception as e:
        print(f"Redis connection failed: {e}")
        _redis_client = None
        return None


CATCHPHRASE_PROMPT = """당신은 영화 추천 전문가입니다. 다음 영화에 대해 한국어로 짧고 매력적인 캐치프레이즈를 작성해주세요.

영화 제목: {title}
장르: {genres}
줄거리: {overview}

규칙:
- 15자 이내로 작성
- 영화의 핵심 매력을 담아야 함
- 감탄사나 이모지 사용 금지
- 예시: "당신의 마음을 훔칠 로맨틱 판타지"

캐치프레이즈만 출력하세요:"""


async def generate_catchphrase(
    movie_id: int,
    title: str,
    overview: str,
    genres: list[str],
    fallback_tagline: Optional[str] = None,
) -> tuple[str, bool]:
    """
    영화에 대한 캐치프레이즈 생성 (Anthropic Claude API 사용)

    Args:
        movie_id: 영화 ID
        title: 영화 제목
        overview: 영화 줄거리
        genres: 영화 장르 목록
        fallback_tagline: API 실패 시 사용할 기본 태그라인

    Returns:
        tuple[str, bool]: (캐치프레이즈, 캐시 여부)
    """
    cache_key = f"catchphrase:{movie_id}"

    # Redis 캐시 확인
    redis = await get_redis_client()
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                print(f"Cache HIT: {cache_key}")
                return cached, True
            print(f"Cache MISS: {cache_key}")
        except Exception as e:
            print(f"Redis get error: {e}")

    # API 키 확인
    if not settings.ANTHROPIC_API_KEY:
        print("Anthropic API key not configured")
        return fallback_tagline or "매력적인 영화", False

    # Anthropic Claude API 호출
    try:
        prompt = CATCHPHRASE_PROMPT.format(
            title=title,
            genres=", ".join(genres) if genres else "알 수 없음",
            overview=overview[:500] if overview else "줄거리 정보 없음",
        )

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=100,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        catchphrase = message.content[0].text.strip()
        # 따옴표 제거
        catchphrase = catchphrase.strip('"\'')

    except Exception as e:
        print(f"Anthropic API error: {e}")
        return fallback_tagline or "매력적인 영화", False

    # Redis 캐시 저장
    if redis:
        try:
            await redis.setex(
                cache_key,
                CATCHPHRASE_CACHE_TTL,
                catchphrase,
            )
            print(f"Cache SET: {cache_key} (TTL: {CATCHPHRASE_CACHE_TTL}s)")
        except Exception as e:
            print(f"Redis set error: {e}")

    return catchphrase, False


# [추가] 장르 기반 AI 영화 선택 프롬프트
AI_PICK_PROMPT = """아래는 영화 목록입니다 (id. 제목 형식):
{movie_list}

사용자가 선호하는 장르: {genres}

위 목록에서 이 장르를 좋아하는 사용자에게 가장 잘 맞는 영화 5편의 id만 콤마로 구분해서 반환하세요.
예시: 123, 456, 789, 101, 202
숫자 id만 반환하세요."""


async def pick_movies_by_genre(
    movie_list: list[dict],  # [{"id": int, "title": str}, ...]
    top_genres: list[str],
) -> list[int]:
    """
    [추가] Claude API로 장르 취향 기반 영화 5편 선택
    - movie_list: id, title만 포함된 후보 영화 목록 (DB 1차 필터링 결과)
    - top_genres: 사용자 선호 장르 리스트
    - 반환: Claude가 선택한 영화 id 리스트 (최대 5개)
    - API 실패 시 앞 5개 반환 (fallback)
    """
    # API 키 없으면 fallback
    if not settings.ANTHROPIC_API_KEY:
        print("Anthropic API key not configured, using fallback")
        return [m["id"] for m in movie_list[:5]]

    try:
        # [추가] 영화 목록 포맷: "id. 제목" 형태
        formatted = "\n".join(f"{m['id']}. {m['title']}" for m in movie_list)
        genres_str = ", ".join(top_genres) if top_genres else "알 수 없음"

        prompt = AI_PICK_PROMPT.format(
            movie_list=formatted,
            genres=genres_str,
        )

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        # [추가] Claude API 호출 — id만 반환받으므로 max_tokens=50으로 충분
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=50,
            messages=[{"role": "user", "content": prompt}]
        )

        # [추가] 응답 파싱: "123, 456, 789, 101, 202" → [123, 456, 789, 101, 202]
        raw = message.content[0].text.strip()
        picked_ids = [int(x.strip()) for x in raw.split(",") if x.strip().isdigit()]
        return picked_ids[:5]

    except Exception as e:
        print(f"AI pick error: {e}")
        # [추가] 실패 시 앞 5개 반환
        return [m["id"] for m in movie_list[:5]]


# [추가] 유사 영화 선택 프롬프트 — 대상 영화 메타정보 기반
SIMILAR_MOVIES_PROMPT = """기준 영화 정보:
- 제목: {title}
- 장르: {genres}
- 감독: {director}
- 분위기: {mood}

후보 영화 목록 (id. 제목):
{movie_list}

이 영화를 좋아한 사람에게 어울리는 영화 5편을 위 목록에서 골라줘.
반드시 JSON 형식으로 id 배열만 반환해: {{"ids": [id1, id2, id3, id4, id5]}}"""


async def pick_similar_movies(
    base_movie: dict,       # {"title": str, "genres": list, "director": str, "mood": list}
    movie_list: list[dict], # [{"id": int, "title": str}, ...]
) -> list[int]:
    """
    [추가] Claude API로 기준 영화와 유사한 영화 5편 선택
    - base_movie: 기준 영화의 메타정보 (장르, 감독, 분위기)
    - movie_list: DB 1차 필터링된 후보 목록 (id, title만)
    - 반환: Claude가 선택한 영화 id 리스트 (최대 5개)
    - API 실패 시 앞 5개 반환 (fallback)
    """
    if not settings.ANTHROPIC_API_KEY:
        return [m["id"] for m in movie_list[:5]]

    try:
        # [추가] 후보 목록 포맷
        formatted = "\n".join(f"{m['id']}. {m['title']}" for m in movie_list)

        prompt = SIMILAR_MOVIES_PROMPT.format(
            title=base_movie.get("title", ""),
            genres=", ".join(base_movie.get("genres", [])) or "알 수 없음",
            director=base_movie.get("director", "알 수 없음"),
            mood=", ".join(base_movie.get("mood", [])) or "알 수 없음",
            movie_list=formatted,
        )

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        # [추가] Claude API 호출 — JSON 응답 요청
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=80,
            messages=[{"role": "user", "content": prompt}]
        )

        # [추가] JSON 파싱: {"ids": [123, 456, ...]} → [123, 456, ...]
        import json, re
        raw = message.content[0].text.strip()
        # 중괄호 블록만 추출 (마크다운 코드블록 방어)
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            ids = [int(i) for i in data.get("ids", []) if str(i).isdigit()]
            return ids[:5]

    except Exception as e:
        print(f"AI similar pick error: {e}")

    # [추가] 실패 시 fallback
    return [m["id"] for m in movie_list[:5]]

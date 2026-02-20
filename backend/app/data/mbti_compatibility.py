"""
MBTI 궁합 점수 및 설명 계산 모듈
4축(E/I, S/N, T/F, J/P) 기반으로 궁합 점수와 설명을 반환합니다.
"""

MBTI_TYPES = [
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP",
]

# 특별 조합 설명 (잘 알려진 궁합 쌍)
_SPECIAL_DESCRIPTIONS: dict[tuple, str] = {
    ("INTJ", "ENFP"): "서로의 세계관을 넓혀주는 환상의 파트너. 깊이 있는 영화를 함께 해석하며 새로운 시각을 얻어요.",
    ("ENFP", "INTJ"): "서로의 세계관을 넓혀주는 환상의 파트너. 깊이 있는 영화를 함께 해석하며 새로운 시각을 얻어요.",
    ("INFJ", "ENTP"): "철학적 대화가 끊이지 않는 조합. 복잡한 서사의 영화를 함께 보면 토론이 밤새 이어져요.",
    ("ENTP", "INFJ"): "철학적 대화가 끊이지 않는 조합. 복잡한 서사의 영화를 함께 보면 토론이 밤새 이어져요.",
    ("INFP", "ENFJ"): "감성을 공유하는 따뜻한 조합. 감동적인 영화에서 함께 눈물 흘리는 공감의 시간을 보내요.",
    ("ENFJ", "INFP"): "감성을 공유하는 따뜻한 조합. 감동적인 영화에서 함께 눈물 흘리는 공감의 시간을 보내요.",
    ("ISTJ", "ESFP"): "정반대의 매력이 시너지를 내는 조합. 서로 다른 취향 덕분에 새로운 장르를 발견하게 돼요.",
    ("ESFP", "ISTJ"): "정반대의 매력이 시너지를 내는 조합. 서로 다른 취향 덕분에 새로운 장르를 발견하게 돼요.",
    ("ENTJ", "INTP"): "전략적 사고를 나누는 지적 조합. 복잡한 플롯의 스릴러나 SF를 함께 분석하며 즐겨요.",
    ("INTP", "ENTJ"): "전략적 사고를 나누는 지적 조합. 복잡한 플롯의 스릴러나 SF를 함께 분석하며 즐겨요.",
}

# 궁합 점수 기반 공통 설명
_SCORE_DESCRIPTIONS = [
    (90, "천생연분! 영화 취향부터 감상 방식까지 완벽하게 맞아떨어지는 조합이에요."),
    (80, "훌륭한 궁합! 서로의 시각을 존중하며 다양한 장르를 함께 즐길 수 있어요."),
    (70, "좋은 조합! 비슷한 듯 다른 취향 덕분에 영화 선택이 늘 흥미로워요."),
    (60, "무난한 궁합. 서로의 취향 차이를 이해하면 더 풍부한 영화 경험을 쌓을 수 있어요."),
    (0,  "도전적인 조합! 서로 다른 시각 덕분에 평소엔 보지 않던 영화를 발견하는 기쁨이 있어요."),
]


def calculate_compatibility(mbti1: str, mbti2: str) -> dict:
    """
    두 MBTI 유형의 궁합 점수와 설명을 반환합니다.

    Returns:
        {"score": int(0~100), "description": str}
    """
    mbti1 = mbti1.upper()
    mbti2 = mbti2.upper()

    # 특별 조합 우선 적용
    if (mbti1, mbti2) in _SPECIAL_DESCRIPTIONS:
        desc = _SPECIAL_DESCRIPTIONS[(mbti1, mbti2)]
        score = _axis_score(mbti1, mbti2)
        return {"score": score, "description": desc}

    score = _axis_score(mbti1, mbti2)

    # 점수 구간별 설명 선택
    description = _SCORE_DESCRIPTIONS[-1][1]
    for threshold, text in _SCORE_DESCRIPTIONS:
        if score >= threshold:
            description = text
            break

    return {"score": score, "description": description}


def _axis_score(mbti1: str, mbti2: str) -> int:
    """
    4축 기반 궁합 점수 계산 (0~100)

    축별 가중치:
    - E/I: 보완적 관계가 좋음 → 다를 때 +22, 같을 때 +18
    - S/N: 세계관 → 같을 때 +28, 다를 때 +12
    - T/F: 보완적 관계가 좋음 → 다를 때 +22, 같을 때 +18
    - J/P: 구조 제공자 → J+P일 때 +22, 같을 때 +18
    기본 점수: 10
    합계 최대: 10 + 28 + 22 + 22 + 22 = 104 → 100 cap
    """
    if len(mbti1) != 4 or len(mbti2) != 4:
        return 50

    score = 10

    # E/I 축 (보완적)
    score += 18 if mbti1[0] == mbti2[0] else 22

    # S/N 축 (세계관 - 같을수록 좋음)
    score += 28 if mbti1[1] == mbti2[1] else 12

    # T/F 축 (보완적)
    score += 18 if mbti1[2] == mbti2[2] else 22

    # J/P 축 (보완적)
    score += 18 if mbti1[3] == mbti2[3] else 22

    return min(score, 100)

from app.schemas import FlowerAnalysisResponse, InteriorGuide


FALLBACKS: dict[str, FlowerAnalysisResponse] = {
    "peony": FlowerAnalysisResponse(
        name="Peony",
        flower_language="A gentle heart, thoughtful care, and quiet grace",
        interior_guide=InteriorGuide(
            style="Minimalistic & Warm",
            placement="Place it in a low ceramic vase on a wooden side table with soft daylight",
            mood_color="#F4CFD7",
        ),
    ),
    "sunflower": FlowerAnalysisResponse(
        name="Sunflower",
        flower_language="Joy, confidence, and open-hearted warmth",
        interior_guide=InteriorGuide(
            style="Sunny Natural",
            placement="Use it as a bright focal point on a dining table or entry console",
            mood_color="#F6C453",
        ),
    ),
    "daisy": FlowerAnalysisResponse(
        name="Daisy",
        flower_language="Innocence, clarity, and cheerful optimism",
        interior_guide=InteriorGuide(
            style="Soft Cottage",
            placement="Arrange a few stems in a clear vase near a breakfast corner or window ledge",
            mood_color="#F5EAD6",
        ),
    ),
    "rose": FlowerAnalysisResponse(
        name="Rose",
        flower_language="Admiration, affection, and romantic depth",
        interior_guide=InteriorGuide(
            style="Classic Romantic",
            placement="Keep a compact bouquet on a warm-toned console or bedside table",
            mood_color="#CF5D72",
        ),
    ),
    "iris": FlowerAnalysisResponse(
        name="Iris",
        flower_language="Wisdom, courage, and elegant hope",
        interior_guide=InteriorGuide(
            style="Gallery Calm",
            placement="Use a tall matte vase near books, framed art, or a quiet reading corner",
            mood_color="#7D87D9",
        ),
    ),
    "lily": FlowerAnalysisResponse(
        name="Lily",
        flower_language="Purity, calm presence, and serene strength",
        interior_guide=InteriorGuide(
            style="Calm Serenity",
            placement="Display one or two stems on a bedside table with generous empty space",
            mood_color="#F3EFE6",
        ),
    ),
    "lotus": FlowerAnalysisResponse(
        name="Lotus",
        flower_language="Clarity, resilience, and peaceful renewal",
        interior_guide=InteriorGuide(
            style="Zen Natural",
            placement="Keep the arrangement low on a broad wood or stone surface for quiet balance",
            mood_color="#F2D7DD",
        ),
    ),
}


def normalize_flower_hint(value: str | None) -> str:
    normalized = (value or "").lower()

    if "sunflower" in normalized or "rapeseed" in normalized:
        return "sunflower"
    if "daisy" in normalized:
        return "daisy"
    if "rose" in normalized:
        return "rose"
    if "iris" in normalized or "crocus" in normalized:
        return "iris"
    if "lily" in normalized or "lady's slipper" in normalized:
        return "lily"
    if "lotus" in normalized:
        return "lotus"

    return "peony"


def fallback_response(hint: str | None) -> FlowerAnalysisResponse:
    return FALLBACKS[normalize_flower_hint(hint)]

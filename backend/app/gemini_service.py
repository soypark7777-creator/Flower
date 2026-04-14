import base64
from typing import Any

from google.genai import Client
from google.genai import types

from app.fallbacks import fallback_response, normalize_flower_hint
from app.schemas import FlowerAnalysisRequest, FlowerAnalysisResponse
from app.settings import settings


PROMPT_TEMPLATE = """
You are a flower analysis assistant.
Analyze the provided flower image and return a JSON object with this exact schema:
{
  "name": "flower name",
  "flower_language": "short explanation of the flower meaning",
  "interior_guide": {
    "style": "interior style phrase",
    "placement": "one practical placement tip",
    "mood_color": "#RRGGBB"
  }
}

Instructions:
- Prefer the actual flower visible in the image over metadata hints.
- Use the hint only as supporting context, never as the sole basis.
- Keep flower_language to one concise sentence.
- Keep style to 2-4 words.
- placement must be a single practical sentence.
- mood_color must be a valid 6-digit hex code.
- Return JSON only.

Context:
- Flower hint: {flower_hint}
- Dominant color: {dominant_color}
- Frontend confidence: {confidence}
""".strip()


class GeminiFlowerAnalyzer:
    def __init__(self) -> None:
        self._client: Client | None = None

        if settings.gemini_api_key:
            self._client = Client(api_key=settings.gemini_api_key)

    def analyze(self, payload: FlowerAnalysisRequest) -> FlowerAnalysisResponse:
        if not self._client:
            return fallback_response(payload.flowerHint)

        prompt = PROMPT_TEMPLATE.format(
            flower_hint=payload.flowerHint or "unknown",
            dominant_color=payload.dominantColor or "unknown",
            confidence=payload.confidence if payload.confidence is not None else "unknown",
        )

        parts: list[Any] = [prompt]

        if payload.imageBase64 and payload.imageMimeType:
            image_bytes = base64.b64decode(payload.imageBase64)
            parts.append(types.Part.from_bytes(data=image_bytes, mime_type=payload.imageMimeType))

        try:
            response = self._client.models.generate_content(
                model=settings.gemini_model,
                contents=parts,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=FlowerAnalysisResponse,
                    temperature=0.3,
                ),
            )

            if response.parsed:
                return response.parsed

            return FlowerAnalysisResponse.model_validate_json(response.text)
        except Exception:
            return fallback_response(payload.flowerHint)


def backend_capabilities() -> dict[str, Any]:
    return {
        "gemini_configured": bool(settings.gemini_api_key),
        "model": settings.gemini_model,
        "fallback_hint": normalize_flower_hint(None),
    }

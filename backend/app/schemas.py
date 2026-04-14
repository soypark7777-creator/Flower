from pydantic import BaseModel, Field


class InteriorGuide(BaseModel):
    style: str
    placement: str
    mood_color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")


class FlowerAnalysisResponse(BaseModel):
    name: str
    flower_language: str
    interior_guide: InteriorGuide


class FlowerAnalysisRequest(BaseModel):
    flowerHint: str | None = None
    dominantColor: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    confidence: float | None = Field(default=None, ge=0, le=1)
    imageBase64: str | None = None
    imageMimeType: str | None = None

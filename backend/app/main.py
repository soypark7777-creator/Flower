from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.gemini_service import GeminiFlowerAnalyzer, backend_capabilities
from app.schemas import FlowerAnalysisRequest, FlowerAnalysisResponse
from app.settings import settings

app = FastAPI(title="Flower Analysis Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = GeminiFlowerAnalyzer()


@app.get("/health")
def health_check() -> dict[str, object]:
    return {"status": "ok", **backend_capabilities()}


@app.post("/api/analyze", response_model=FlowerAnalysisResponse)
def analyze_flower(payload: FlowerAnalysisRequest) -> FlowerAnalysisResponse:
    return analyzer.analyze(payload)

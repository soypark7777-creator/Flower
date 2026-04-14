# Flower Python Backend

## Run

```bash
py -m pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

## Endpoints

- `POST /api/analyze`
- `GET /health`

## Request payload

```json
{
  "flowerHint": "sunflower",
  "dominantColor": "#F6C453",
  "confidence": 0.82,
  "imageBase64": "base64-encoded-jpeg",
  "imageMimeType": "image/jpeg"
}
```

## Response contract

```json
{
  "name": "Sunflower",
  "flower_language": "Joy, confidence, and open-hearted warmth",
  "interior_guide": {
    "style": "Sunny Natural",
    "placement": "Use it as a bright focal point on a dining table or entry console",
    "mood_color": "#F6C453"
  }
}
```

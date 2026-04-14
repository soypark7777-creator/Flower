# Petal Portal — 다음 작업 가이드

> 마지막 작업일: 2026-04-14  
> 현재 브랜치: `main` (GitHub: https://github.com/soypark7777-creator/Flower)

---

## 현재 완료된 것

| 영역 | 상태 | 내용 |
|------|------|------|
| Next.js 프로젝트 기반 | ✅ | Tailwind, TypeScript, App Router 세팅 완료 |
| 홈 페이지 (`/`) | ✅ | 히어로 비디오, 소개 카드 3종 |
| 탐색 페이지 (`/explore`) | ✅ | 실시간 카메라 + 사진 업로드 UI, TensorFlow.js 연동 구조 |
| TF.js 모델 | ✅ | EfficientNetB0 기반 Oxford 102종 모델 빌드 완료 (`public/models/flowers-oxford102/`) |
| 모델 학습 파이프라인 | ✅ | `backend/training/` — `.h5` / `.keras` / TF.js shard 파일 생성 |
| FastAPI 백엔드 | ✅ | `/api/analyze` 엔드포인트, Gemini API 연동, fallback 응답 포함 |
| 타입 계약 | ✅ | `lib/types.ts` — `FlowerAnalysisRequest` / `FlowerAnalysisResponse` |
| API 클라이언트 | ✅ | `lib/api.ts` — 백엔드 실패 시 로컬 fallback 자동 전환 |

---

## 당장 해야 할 작업 (우선순위 순)

### 1. 환경 변수 설정 (로컬 실행을 위해 필수)

프로젝트 루트에 `.env.local` 파일을 직접 만들어야 합니다 (`.gitignore`에 포함되어 있어 GitHub에 없음).

```
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

백엔드 폴더에도 `backend/.env` 파일 생성:
```
# backend/.env
GEMINI_API_KEY=여기에_구글_Gemini_API_키_입력
```

---

### 2. 백엔드 서버 실행 확인

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/health` 접속 시 `{"status": "ok"}` 응답이 오면 정상.

---

### 3. 프론트엔드 실행 확인

```bash
# 프로젝트 루트에서
npm install
npm run dev
```

`http://localhost:3000` → `/explore` 페이지에서 카메라 허용 후 꽃을 비추면 분석 시작.

---

### 4. `/explore` 페이지 — 결과 카드 UI 완성

현재 `explore-experience.tsx`에서 분석 결과(`FlowerAnalysisResponse`)를 받아오는 흐름은 구현되어 있으나, **결과를 보여주는 카드 UI**가 미완성 상태일 수 있습니다.

완성해야 할 항목:
- [ ] 꽃 이름 + 꽃말(`flower_language`) 표시 카드
- [ ] 인테리어 스타일(`style`) + 배치 팁(`placement`) 표시
- [ ] `mood_color` hex 값을 배경 또는 포인트 컬러로 시각화
- [ ] 결과 카드 → 홈으로 돌아가기 버튼

참고 데이터 구조 (`lib/types.ts`):
```ts
FlowerAnalysisResponse = {
  name: string;
  flower_language: string;
  interior_guide: {
    style: string;
    placement: string;
    mood_color: string; // "#RRGGBB"
  };
}
```

---

### 5. TF.js 모델 연동 검증

`public/models/flowers-oxford102/model.json` 이 로드되는지 브라우저 콘솔에서 확인.

- 모델은 **EfficientNetB0 기반**, 입력 크기 `224×224`, 102종 분류
- 라벨 목록은 `backend/training/artifacts/metadata.json`의 `labels` 배열과 동일한 순서
- 프론트엔드 라벨 매핑이 이 순서와 맞는지 `lib/vision/flower-heuristic.ts`에서 확인 필요

---

### 6. 모바일 반응형 점검

사용자가 야외에서 스마트폰으로 꽃을 비추는 시나리오가 핵심입니다.

- [ ] `/explore` 페이지 카메라 뷰 모바일 레이아웃 확인
- [ ] 결과 카드 세로 스크롤 UX 확인
- [ ] iOS Safari 카메라 권한 동작 테스트

---

## 향후 추가 기능 (선택)

| 기능 | 설명 |
|------|------|
| 결과 공유 | 분석 결과를 이미지로 저장하거나 SNS 공유 |
| 꽃 탐색 갤러리 | 이전에 분석한 꽃 기록 보관 |
| 다국어 지원 | 한국어 / 영어 꽃말 전환 |
| Vercel 배포 | 프론트엔드 배포 (`NEXT_PUBLIC_API_BASE_URL`을 배포된 백엔드 주소로 변경) |
| Railway / Render 배포 | FastAPI 백엔드 배포 |

---

## 파일 구조 요약

```
Flower/
├── app/
│   ├── page.tsx                  # 홈 페이지
│   ├── explore/page.tsx          # 탐색 페이지
│   └── api/analyze/route.ts      # Next.js API 라우트 (백엔드 없을 때 대체)
├── components/
│   └── explore/explore-experience.tsx  # 카메라 + 분석 UI 핵심 컴포넌트
├── lib/
│   ├── types.ts                  # 공유 타입 정의
│   ├── api.ts                    # 백엔드 호출 함수
│   ├── mock-analysis.ts          # 오프라인 fallback 데이터
│   └── vision/flower-heuristic.ts # TF.js 모델 로드 + 추론 로직
├── public/
│   ├── models/flowers-oxford102/ # TF.js 모델 파일 (model.json + shard .bin)
│   ├── images/hero.jpg
│   └── videos/hero.mp4
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI 앱 진입점
│   │   ├── gemini_service.py     # Gemini API 연동
│   │   ├── schemas.py            # 요청/응답 스키마
│   │   ├── settings.py           # 환경 변수 관리
│   │   └── fallbacks.py          # Gemini 실패 시 fallback
│   ├── training/
│   │   ├── train_flowers_checkpoint.py  # 모델 학습
│   │   ├── export_tfjs_checkpoint.py    # TF.js 포맷 변환
│   │   ├── prepare_h5_from_keras.py     # .keras → .h5 변환
│   │   └── artifacts/            # 학습된 모델 파일
│   └── requirements.txt
└── NEXT_STEPS.md                 # 이 파일
```

---

## 로컬 개발 빠른 시작

```bash
# 터미널 1 — 백엔드
cd backend && uvicorn app.main:app --reload --port 8000

# 터미널 2 — 프론트엔드
npm run dev
```

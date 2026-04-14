# Petal Portal

Frontend and backend scaffold for the Flower project guide.

## Frontend

```bash
npm install
npm run dev
```

## Python backend

```bash
py -m pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

## Flower checkpoint pipeline

```bash
py -m pip install -r backend/training/requirements-train.txt
py backend/training/train_flowers_checkpoint.py
py backend/training/export_tfjs_checkpoint.py
```

## Git LFS for model files

```bash
git lfs install
git lfs track "public/models/flowers-oxford102/*.bin"
git lfs track "public/models/flowers-oxford102/model.json"
git add .gitattributes
```

## Notes

- Main landing page: `/`
- Explore experience: `/explore`
- Frontend API proxy: `app/api/analyze/route.ts`
- Python backend entry: `backend/app/main.py`
- Shared response contract: `lib/types.ts`
- Repo-local TFJS checkpoint target: `public/models/flowers-oxford102`

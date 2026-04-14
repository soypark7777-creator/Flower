# Flower Checkpoint Training

This training pipeline is for generating a flower-specific TensorFlow.js checkpoint that can live inside the repo at `public/models/flowers-oxford102`.

## Dataset

- TensorFlow Datasets: `oxford_flowers102`

## Install training dependencies

```bash
py -m pip install -r backend/training/requirements-train.txt
```

## Install the TensorFlow.js converter

Windows with Python 3.12 can hit dependency conflicts if `tensorflowjs` is installed with full optional dependencies. Install the converter package separately:

```bash
py -m pip install tensorflowjs==4.22.0 --no-deps
```

## Train the checkpoint

```bash
py backend/training/train_flowers_checkpoint.py
```

This produces:

- `backend/training/artifacts/flowers_oxford102.keras`
- `backend/training/artifacts/metadata.json`

## Export to TensorFlow.js

```bash
py backend/training/export_tfjs_checkpoint.py
```

This writes the repo-local checkpoint files to:

- `public/models/flowers-oxford102/model.json`
- `public/models/flowers-oxford102/group*.bin`
- `public/models/flowers-oxford102/metadata.json`

## Runtime behavior

- If the checkpoint exists in `public/models/flowers-oxford102`, `/explore` uses it first.
- If the checkpoint is missing, the app falls back to MobileNet so development still works.

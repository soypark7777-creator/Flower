from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = REPO_ROOT / "backend" / "training" / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "flowers_oxford102.h5"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
PUBLIC_DIR = REPO_ROOT / "public" / "models" / "flowers-oxford102"


def main():
    if not MODEL_PATH.exists():
        raise SystemExit(
            f"Trained Keras model not found at {MODEL_PATH}. Run train_flowers_checkpoint.py first."
        )

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [
            sys.executable,
            "-m",
            "tensorflowjs.converters.converter",
            "--input_format=keras",
            str(MODEL_PATH),
            str(PUBLIC_DIR),
        ],
        check=True,
    )

    if METADATA_PATH.exists():
        shutil.copy2(METADATA_PATH, PUBLIC_DIR / "metadata.json")

    print(f"Exported TFJS checkpoint to {PUBLIC_DIR}")


if __name__ == "__main__":
    main()

from pathlib import Path

import tensorflow as tf


REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = REPO_ROOT / "backend" / "training" / "artifacts"
KERAS_PATH = ARTIFACT_DIR / "flowers_oxford102.keras"
H5_PATH = ARTIFACT_DIR / "flowers_oxford102.h5"


def main():
    if not KERAS_PATH.exists():
        raise SystemExit(f"Missing {KERAS_PATH}. Run train_flowers_checkpoint.py first.")

    model = tf.keras.models.load_model(KERAS_PATH)
    model.save(H5_PATH)
    print(f"Saved H5 model to {H5_PATH}")


if __name__ == "__main__":
    main()

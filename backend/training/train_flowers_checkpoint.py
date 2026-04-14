from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import tensorflow as tf
import tensorflow_datasets as tfds


IMAGE_SIZE = 224
BATCH_SIZE = 32
EPOCHS_HEAD = 6
EPOCHS_FINETUNE = 8
AUTOTUNE = tf.data.AUTOTUNE

REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = REPO_ROOT / "backend" / "training" / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "flowers_oxford102.keras"
H5_PATH = ARTIFACT_DIR / "flowers_oxford102.h5"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
CONFUSION_PATH = ARTIFACT_DIR / "confusion_matrix.json"
TULIP_REPORT_PATH = ARTIFACT_DIR / "tulip_report.json"


def preprocess(
    image: tf.Tensor,
    label: tf.Tensor,
    *,
    training: bool,
    tulip_index: int | None,
):
    if training:
        image = tf.image.resize(image, (IMAGE_SIZE + 24, IMAGE_SIZE + 24))
    else:
        image = tf.image.resize(image, (IMAGE_SIZE, IMAGE_SIZE))

    image = tf.cast(image, tf.float32) / 255.0

    if training:
        image = tf.image.random_crop(image, size=[IMAGE_SIZE, IMAGE_SIZE, 3])
        image = tf.image.random_flip_left_right(image)
        image = tf.image.random_brightness(image, 0.12)
        image = tf.image.random_contrast(image, 0.85, 1.15)

        if tulip_index is not None:
            def tulip_aug():
                img = tf.image.random_saturation(image, 0.7, 1.35)
                img = tf.image.random_hue(img, 0.06)
                img = tf.image.random_contrast(img, 0.8, 1.2)
                return img

            image = tf.cond(tf.equal(label, tulip_index), tulip_aug, lambda: image)

    return image, label


def build_datasets(tulip_index: int | None):
    train = tfds.load("oxford_flowers102", split="train", as_supervised=True)
    validation = tfds.load("oxford_flowers102", split="validation", as_supervised=True)
    test = tfds.load("oxford_flowers102", split="test", as_supervised=True)

    train = (
        train.map(
            lambda image, label: preprocess(
                image, label, training=True, tulip_index=tulip_index
            ),
            num_parallel_calls=AUTOTUNE,
        )
        .shuffle(2048)
        .batch(BATCH_SIZE)
        .prefetch(AUTOTUNE)
    )
    validation = (
        validation.map(
            lambda image, label: preprocess(
                image, label, training=False, tulip_index=tulip_index
            ),
            num_parallel_calls=AUTOTUNE,
        )
        .batch(BATCH_SIZE)
        .prefetch(AUTOTUNE)
    )
    test = (
        test.map(
            lambda image, label: preprocess(
                image, label, training=False, tulip_index=tulip_index
            ),
            num_parallel_calls=AUTOTUNE,
        )
        .batch(BATCH_SIZE)
        .prefetch(AUTOTUNE)
    )

    return train, validation, test


def build_model(num_classes: int):
    base_model = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3),
    )
    base_model.trainable = False

    inputs = tf.keras.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3))
    x = tf.keras.applications.efficientnet.preprocess_input(inputs * 255.0)
    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)
    model = tf.keras.Model(inputs=inputs, outputs=outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    return model, base_model


def find_label_index(labels: list[str], keyword: str) -> int | None:
    keyword = keyword.lower()
    for index, label in enumerate(labels):
        if keyword in label.lower():
            return index
    return None


def evaluate_confusion_matrix(
    model: tf.keras.Model,
    test_ds: tf.data.Dataset,
    labels: list[str],
    tulip_index: int | None,
):
    y_true: list[int] = []
    y_pred: list[int] = []

    for batch_images, batch_labels in test_ds:
        predictions = model.predict(batch_images, verbose=0)
        y_true.append(batch_labels.numpy())
        y_pred.append(tf.argmax(predictions, axis=1).numpy())

    y_true_array = np.concatenate(y_true, axis=0)
    y_pred_array = np.concatenate(y_pred, axis=0)

    confusion = tf.math.confusion_matrix(
        y_true_array, y_pred_array, num_classes=len(labels)
    ).numpy()

    CONFUSION_PATH.write_text(
        json.dumps(confusion.tolist(), indent=2),
        encoding="utf-8",
    )

    if tulip_index is None:
        print("Tulip label not found. Skipping tulip report.")
        return

    tulip_row = confusion[tulip_index]
    tulip_col = confusion[:, tulip_index]
    tp = int(confusion[tulip_index, tulip_index])
    fn = int(tulip_row.sum() - tp)
    fp = int(tulip_col.sum() - tp)

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

    sorted_indices = np.argsort(tulip_row)[::-1]
    confusions: list[dict[str, int | str]] = []
    for index in sorted_indices:
        if index == tulip_index:
            continue
        count = int(tulip_row[index])
        if count == 0:
            break
        confusions.append({"label": labels[index], "count": count})
        if len(confusions) >= 5:
            break

    report = {
        "tulip_label": labels[tulip_index],
        "precision": precision,
        "recall": recall,
        "false_positive": fp,
        "false_negative": fn,
        "top_confusions": confusions,
    }

    TULIP_REPORT_PATH.write_text(
        json.dumps(report, indent=2),
        encoding="utf-8",
    )
    print("Tulip report:", json.dumps(report, indent=2))


def main():
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    builder = tfds.builder("oxford_flowers102")
    builder.download_and_prepare()
    labels = builder.info.features["label"].names
    tulip_index = find_label_index(labels, "tulip")

    train_ds, val_ds, test_ds = build_datasets(tulip_index)
    model, base_model = build_model(num_classes=len(labels))

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=3,
            restore_best_weights=True,
        )
    ]

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_HEAD,
        callbacks=callbacks,
    )

    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_FINETUNE,
        callbacks=callbacks,
    )

    loss, accuracy = model.evaluate(test_ds, verbose=1)
    print({"test_loss": float(loss), "test_accuracy": float(accuracy)})

    evaluate_confusion_matrix(model, test_ds, labels, tulip_index)

    model.save(MODEL_PATH)
    model.save(H5_PATH)

    metadata = {
        "labels": labels,
        "imageSize": IMAGE_SIZE,
        "modelType": "layers",
        "dataset": "oxford_flowers102",
        "baseModel": "EfficientNetB0",
        "preprocess": "divide_by_255_then_efficientnet_preprocess_input"
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()

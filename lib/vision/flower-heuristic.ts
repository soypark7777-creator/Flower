import type * as mobilenet from "@tensorflow-models/mobilenet";
import type { FlowerPrediction } from "@/lib/types";

type TensorflowModule = typeof import("@tensorflow/tfjs");
type MobilenetModule = typeof import("@tensorflow-models/mobilenet");
type WebglBackendModule = typeof import("@tensorflow/tfjs-backend-webgl");

type Tensor3D = import("@tensorflow/tfjs").Tensor3D;
type LayersModel = import("@tensorflow/tfjs").LayersModel;
type MediaSource = HTMLVideoElement | HTMLImageElement;
export type MobileNetModel = mobilenet.MobileNet;

type FlowerCheckpointMetadata = {
  labels: string[];
  imageSize: number;
  modelType: "layers";
  dataset: string;
};

export type FlowerClassifier =
  | {
      kind: "flower-checkpoint";
      model: LayersModel;
      metadata: FlowerCheckpointMetadata;
    }
  | {
      kind: "mobilenet-fallback";
      model: MobileNetModel;
    };

export type FlowerFrameAnalysis = {
  isFlowerCandidate: boolean;
  confidence: number;
  brightness: number;
  dominantHex: string;
  flowerLabel: string;
  predictions: FlowerPrediction[];
  modelSource: "flower-checkpoint" | "mobilenet-fallback";
};

const FLOWER_KEYWORDS = [
  "flower",
  "daisy",
  "sunflower",
  "lily",
  "lotus",
  "rose",
  "iris",
  "crocus",
  "lady's slipper",
  "rapeseed"
];

const LOCAL_MODEL_URL = "/models/flowers-oxford102/model.json";
const LOCAL_METADATA_URL = "/models/flowers-oxford102/metadata.json";

export async function loadFlowerClassifier() {
  const [tf] = await Promise.all([
    import("@tensorflow/tfjs") as Promise<TensorflowModule>,
    import("@tensorflow/tfjs-backend-webgl") as Promise<WebglBackendModule>
  ]);

  await tf.setBackend("webgl");
  await tf.ready();

  const localClassifier = await tryLoadLocalFlowerCheckpoint(tf);
  if (localClassifier) {
    return { tf, classifier: localClassifier };
  }

  const mobilenetModule = (await import(
    "@tensorflow-models/mobilenet"
  )) as MobilenetModule;

  const model = await mobilenetModule.load({
    version: 2,
    alpha: 1
  });

  return {
    tf,
    classifier: {
      kind: "mobilenet-fallback" as const,
      model
    }
  };
}

export async function analyzeVideoFrame(
  tf: TensorflowModule,
  classifier: FlowerClassifier,
  video: HTMLVideoElement
): Promise<FlowerFrameAnalysis> {
  return analyzeMediaFrame(tf, classifier, video);
}

export async function analyzeImageFrame(
  tf: TensorflowModule,
  classifier: FlowerClassifier,
  image: HTMLImageElement
): Promise<FlowerFrameAnalysis> {
  return analyzeMediaFrame(tf, classifier, image);
}

export function captureVideoFrame(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
  const [header, imageBase64] = dataUrl.split(",");
  const imageMimeType = header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";

  return {
    imageBase64,
    imageMimeType
  };
}

export function captureImageFrame(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || 640;
  canvas.height = image.naturalHeight || 480;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const [header, imageBase64] = dataUrl.split(",");
  const imageMimeType = header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";

  return {
    imageBase64,
    imageMimeType
  };
}

async function tryLoadLocalFlowerCheckpoint(tf: TensorflowModule) {
  try {
    const [metadataResponse, model] = await Promise.all([
      fetch(LOCAL_METADATA_URL, { cache: "no-store" }),
      tf.loadLayersModel(LOCAL_MODEL_URL)
    ]);

    if (!metadataResponse.ok) {
      throw new Error("Model metadata is missing.");
    }

    const metadata = (await metadataResponse.json()) as FlowerCheckpointMetadata;

    if (!metadata.labels?.length) {
      throw new Error("Checkpoint metadata has no labels.");
    }

    return {
      kind: "flower-checkpoint" as const,
      model,
      metadata
    };
  } catch {
    return null;
  }
}

async function analyzeWithMobileNet(
  tf: TensorflowModule,
  model: MobileNetModel,
  source: MediaSource
) {
  const predictions = (await model.classify(source, 5)).map((prediction) => ({
    className: prediction.className,
    probability: prediction.probability
  }));

  const flowerPrediction =
    predictions.find((prediction) =>
      FLOWER_KEYWORDS.some((keyword) =>
        prediction.className.toLowerCase().includes(keyword)
      )
    ) ?? predictions[0];

  const confidence = flowerPrediction?.probability ?? 0;
  const { dominantHex, brightness } = inspectFrameColor(tf, source);

  return {
    isFlowerCandidate: Boolean(flowerPrediction) && confidence >= 0.18,
    confidence,
    brightness,
    dominantHex,
    flowerLabel: flowerPrediction?.className ?? "unknown bloom",
    predictions,
    modelSource: "mobilenet-fallback" as const
  };
}

async function analyzeWithCheckpoint(
  tf: TensorflowModule,
  classifier: Extract<FlowerClassifier, { kind: "flower-checkpoint" }>,
  source: MediaSource
) {
  const { probabilities } = tf.tidy(() => {
    const frame = tf.browser.fromPixels(source).toFloat().div(255) as Tensor3D;
    const resized = tf.image.resizeBilinear(frame, [
      classifier.metadata.imageSize,
      classifier.metadata.imageSize
    ]) as Tensor3D;
    const batched = resized.expandDims(0);
    const logits = classifier.model.predict(batched) as Tensor3D;
    const scores = tf.softmax(logits).dataSync();

    return {
      probabilities: Array.from(scores)
    };
  });

  const predictions = classifier.metadata.labels
    .map((label, index) => ({
      className: label,
      probability: probabilities[index] ?? 0
    }))
    .sort((left, right) => right.probability - left.probability)
    .slice(0, 5);

  const bestPrediction = predictions[0];
  const { dominantHex, brightness } = inspectFrameColor(tf, source);

  return {
    isFlowerCandidate: Boolean(bestPrediction) && (bestPrediction?.probability ?? 0) >= 0.4,
    confidence: bestPrediction?.probability ?? 0,
    brightness,
    dominantHex,
    flowerLabel: bestPrediction?.className ?? "unknown bloom",
    predictions,
    modelSource: "flower-checkpoint" as const
  };
}

function inspectFrameColor(tf: TensorflowModule, source: MediaSource) {
  return tf.tidy(() => {
    const frame = tf.browser.fromPixels(source).toFloat().div(255) as Tensor3D;
    const resized = tf.image.resizeBilinear(frame, [96, 96]) as Tensor3D;
    const center = resized.slice([20, 20, 0], [56, 56, 3]);

    const rgb = center.mean([0, 1]).arraySync() as number[];
    const brightness = center.mean().arraySync() as number;

    return {
      dominantHex: rgbToHex(rgb[0], rgb[1], rgb[2]),
      brightness
    };
  });
}

async function analyzeMediaFrame(
  tf: TensorflowModule,
  classifier: FlowerClassifier,
  source: MediaSource
) {
  if (classifier.kind === "flower-checkpoint") {
    return analyzeWithCheckpoint(tf, classifier, source);
  }

  return analyzeWithMobileNet(tf, classifier.model, source);
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((channel) => Math.round(clamp(channel, 0, 1) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  LoaderCircle,
  RefreshCcw,
  ScanSearch,
  Sparkles,
  Wand2
} from "lucide-react";
import { fetchFlowerAnalysis } from "@/lib/api";
import { getLocalFlowerSuggestion, normalizeFlowerLabel } from "@/lib/mock-analysis";
import type { FlowerAnalysisResponse, FlowerPrediction } from "@/lib/types";
import type {
  FlowerClassifier,
  FlowerFrameAnalysis,
} from "@/lib/vision/flower-heuristic";

type TensorflowModule = typeof import("@tensorflow/tfjs");
type AnalyzeVideoFrame = typeof import("@/lib/vision/flower-heuristic").analyzeVideoFrame;
type AnalyzeImageFrame = typeof import("@/lib/vision/flower-heuristic").analyzeImageFrame;
type CaptureVideoFrame = typeof import("@/lib/vision/flower-heuristic").captureVideoFrame;
type CaptureImageFrame = typeof import("@/lib/vision/flower-heuristic").captureImageFrame;
type LoadFlowerClassifier = typeof import("@/lib/vision/flower-heuristic").loadFlowerClassifier;

type CameraState =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

type DetectionState =
  | "warming"
  | "searching"
  | "centered"
  | "analyzing"
  | "ready"
  | "lost";

const statusCopy: Record<DetectionState, { title: string; body: string }> = {
  warming: {
    title: "Classifier is warming up",
    body: "The MobileNet model is loading so the camera can classify the live frame."
  },
  searching: {
    title: "Looking for a flower",
    body: "Move the flower slowly into the center guide so the model can lock onto it."
  },
  centered: {
    title: "Flower candidate found",
    body: "The classifier sees a stable bloom candidate in the center frame."
  },
  analyzing: {
    title: "Sending the frame to the backend",
    body: "The image, flower hint, and mood color are being turned into a full guide."
  },
  ready: {
    title: "Analysis complete",
    body: "The result card is ready with flower meaning and interior placement guidance."
  },
  lost: {
    title: "Target drifted away",
    body: "Bring the flower back into the center guide to continue the live flow."
  }
};

const permissionCopy: Record<Exclude<CameraState, "ready">, string> = {
  idle: "Start the camera to begin the live flower exploration flow.",
  requesting: "Waiting for the browser camera permission response.",
  denied: "Camera permission was denied. Allow camera access in the browser and try again.",
  unsupported: "This browser does not support the required camera APIs.",
  error: "The camera could not be started. Check whether another app is using it."
};

export function ExploreExperience() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisTimerRef = useRef<number | null>(null);
  const tfRef = useRef<TensorflowModule | null>(null);
  const classifierRef = useRef<FlowerClassifier | null>(null);
  const analyzeFrameRef = useRef<AnalyzeVideoFrame | null>(null);
  const analyzeImageRef = useRef<AnalyzeImageFrame | null>(null);
  const captureFrameRef = useRef<CaptureVideoFrame | null>(null);
  const captureImageRef = useRef<CaptureImageFrame | null>(null);
  const loadClassifierRef = useRef<LoadFlowerClassifier | null>(null);
  const uploadImageRef = useRef<HTMLImageElement | null>(null);
  const isAnalyzingRef = useRef(false);
  const stableDetectionsRef = useRef(0);
  const lostFramesRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [detectionState, setDetectionState] = useState<DetectionState>("warming");
  const [visionReady, setVisionReady] = useState(false);
  const [frameInsight, setFrameInsight] = useState<FlowerFrameAnalysis | null>(null);
  const [lastInsight, setLastInsight] = useState<FlowerFrameAnalysis | null>(null);
  const [result, setResult] = useState<FlowerAnalysisResponse | null>(null);
  const [resultSource, setResultSource] = useState<"local" | "api">("local");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [showComplete, setShowComplete] = useState(false);

  const stopCamera = useCallback(() => {
    if (analysisTimerRef.current) {
      window.clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const runAnalysisRequest = useCallback(async (insight: FlowerFrameAnalysis) => {
    if (isAnalyzingRef.current || !videoRef.current || !captureFrameRef.current) {
      return;
    }

    isAnalyzingRef.current = true;
    setDetectionState("analyzing");
    setErrorMessage(null);

    const capture = captureFrameRef.current(videoRef.current);

    try {
      const response = await fetchFlowerAnalysis({
        flowerHint: insight.flowerLabel,
        dominantColor: insight.dominantHex,
        confidence: insight.confidence,
        imageBase64: capture?.imageBase64,
        imageMimeType: capture?.imageMimeType
      });

      setResult(response);
      setResultSource("api");
      setDetectionState("ready");
      setShowComplete(true);
    } catch {
      setResult(getLocalFlowerSuggestion(insight.flowerLabel));
      setResultSource("local");
      setDetectionState("ready");
      setShowComplete(true);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, []);

  const runUploadAnalysis = useCallback(async () => {
    if (
      uploadBusy ||
      !uploadImageRef.current ||
      !tfRef.current ||
      !classifierRef.current ||
      !analyzeImageRef.current ||
      !captureImageRef.current
    ) {
      return;
    }

    setUploadBusy(true);
    setDetectionState("analyzing");
    setErrorMessage(null);

    const insight = await analyzeImageRef.current(
      tfRef.current,
      classifierRef.current,
      uploadImageRef.current
    );
    setFrameInsight(insight);
    setLastInsight(insight);

    const capture = captureImageRef.current(uploadImageRef.current);

    try {
      const response = await fetchFlowerAnalysis({
        flowerHint: insight.flowerLabel,
        dominantColor: insight.dominantHex,
        confidence: insight.confidence,
        imageBase64: capture?.imageBase64,
        imageMimeType: capture?.imageMimeType
      });

      setResult(response);
      setResultSource("api");
      setDetectionState("ready");
      setShowComplete(true);
    } catch {
      setResult(getLocalFlowerSuggestion(insight.flowerLabel));
      setResultSource("local");
      setDetectionState("ready");
      setShowComplete(true);
    } finally {
      setUploadBusy(false);
    }
  }, [uploadBusy]);

  const beginDetectionLoop = useCallback(() => {
    if (!videoRef.current || !tfRef.current || !classifierRef.current || !analyzeFrameRef.current) {
      return;
    }

    if (analysisTimerRef.current) {
      window.clearInterval(analysisTimerRef.current);
    }

    analysisTimerRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      const tf = tfRef.current;
      const classifier = classifierRef.current;
      const analyzeVideoFrame = analyzeFrameRef.current;

      if (!video || !tf || !classifier || !analyzeVideoFrame || video.readyState < 2 || !visionReady) {
        return;
      }

      const insight = await analyzeVideoFrame(tf, classifier, video);
      setFrameInsight(insight);
      setLastInsight(insight);

      if (insight.isFlowerCandidate) {
        lostFramesRef.current = 0;
        stableDetectionsRef.current += 1;

        if (stableDetectionsRef.current >= 2 && !isAnalyzingRef.current) {
          setDetectionState((current) => (current === "ready" ? current : "centered"));
        }

        if (stableDetectionsRef.current >= 3 && !result && !isAnalyzingRef.current) {
          void runAnalysisRequest(insight);
        }

        return;
      }

      stableDetectionsRef.current = 0;
      lostFramesRef.current += 1;

      if (lostFramesRef.current >= 2) {
        setDetectionState(result ? "lost" : "searching");
      }
    }, 700);
  }, [result, runAnalysisRequest, visionReady]);

  const startCamera = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraState("unsupported");
      setDetectionState("warming");
      return;
    }

    stopCamera();
    setCameraState("requesting");
    setDetectionState("warming");
    setErrorMessage(null);
    setResult(null);
    setFrameInsight(null);
    setResultSource("local");
    setShowComplete(false);
    stableDetectionsRef.current = 0;
    lostFramesRef.current = 0;

    try {
      if (!loadClassifierRef.current) {
        const visionModule = await import("@/lib/vision/flower-heuristic");
        loadClassifierRef.current = visionModule.loadFlowerClassifier;
        analyzeFrameRef.current = visionModule.analyzeVideoFrame;
        analyzeImageRef.current = visionModule.analyzeImageFrame;
        captureFrameRef.current = visionModule.captureVideoFrame;
        captureImageRef.current = visionModule.captureImageFrame;
      }

      if (!tfRef.current || !classifierRef.current) {
        const { tf, classifier } = await loadClassifierRef.current();
        tfRef.current = tf;
        classifierRef.current = classifier;
      }

      setVisionReady(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState("ready");
      setDetectionState("searching");
      beginDetectionLoop();
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setCameraState("denied");
      } else {
        setCameraState("error");
      }

      setErrorMessage("The camera or classifier could not be started.");
    }
  }, [beginDetectionLoop, stopCamera]);

  useEffect(() => {
    void startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const readinessLabel = !visionReady
    ? "Warming"
    : cameraState !== "ready"
      ? "Camera off"
      : detectionState === "ready"
        ? "Detected"
        : "Live";

  const currentCopy = statusCopy[detectionState];
  const displayInsight = frameInsight ?? lastInsight;
  const activeSuggestion = displayInsight
    ? getLocalFlowerSuggestion(displayInsight.flowerLabel)
    : null;
  const normalizedFamily = displayInsight
    ? normalizeFlowerLabel(displayInsight.flowerLabel)
    : "";
  const resultBadge = result
    ? `${mode === "upload" ? "Upload" : "Live"} · ${resultSource === "api" ? "API" : "Local"}`
    : null;

  const handleUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!loadClassifierRef.current) {
      const visionModule = await import("@/lib/vision/flower-heuristic");
      loadClassifierRef.current = visionModule.loadFlowerClassifier;
      analyzeFrameRef.current = visionModule.analyzeVideoFrame;
      analyzeImageRef.current = visionModule.analyzeImageFrame;
      captureFrameRef.current = visionModule.captureVideoFrame;
      captureImageRef.current = visionModule.captureImageFrame;
    }

    if (!tfRef.current || !classifierRef.current) {
      const { tf, classifier } = await loadClassifierRef.current();
      tfRef.current = tf;
      classifierRef.current = classifier;
      setVisionReady(true);
    }

    stopCamera();
    setMode("upload");
    setCameraState("idle");
    setDetectionState("searching");
    setResult(null);
    setFrameInsight(null);
    setResultSource("local");
    setShowComplete(false);

    const objectUrl = URL.createObjectURL(file);
    setUploadPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });
    setUploadName(file.name);
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-petal-moss">
      <section className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-petal-sage">
              Explore
            </p>
            <h1 className="font-heading text-4xl md:text-5xl">
              Live flower discovery stage
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-petal-moss/75">
              The explore flow now prefers a local flower-specific TensorFlow.js
              checkpoint from this repo. If that checkpoint is not present yet,
              it falls back to MobileNet so development can keep moving.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-petal-moss/10 bg-white px-4 py-2 text-sm shadow-sm">
              Local flower checkpoint
            </span>
            <span className="rounded-full border border-petal-moss/10 bg-white px-4 py-2 text-sm shadow-sm">
              Python backend ready
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-petal-moss/10 bg-[#1d2d24] p-5 text-white shadow-bloom">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                  <Camera className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-white/60">Live camera canvas</p>
                  <p className="text-base font-medium">Flower checkpoint classification</p>
                </div>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/75">
                {readinessLabel}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
              {mode === "camera" ? (
                <video
                  ref={videoRef}
                  className="h-[420px] w-full object-cover md:h-[520px]"
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center md:h-[520px]">
                  {uploadPreview ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={uploadPreview}
                        alt="Uploaded flower preview"
                        fill
                        unoptimized
                        className="object-contain"
                        onLoadingComplete={(image) => {
                          uploadImageRef.current = image;
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">Upload a photo to analyze.</p>
                  )}
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0,_transparent_35%,_rgba(10,18,12,0.42)_100%)]" />

              <div
                className={`pointer-events-none absolute left-1/2 top-1/2 h-[52%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border transition ${
                  detectionState === "centered" || detectionState === "ready"
                    ? "border-petal-blush shadow-[0_0_0_999px_rgba(255,255,255,0.02)]"
                    : detectionState === "analyzing"
                      ? "border-[#ffe7a8]"
                      : "border-white/35"
                }`}
              />

              <div className="absolute left-5 top-5 max-w-xs rounded-[1.5rem] bg-black/38 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-petal-blush">
                  {detectionState === "ready" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : detectionState === "lost" || cameraState === "error" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}
                  <p className="text-sm font-medium">{currentCopy.title}</p>
                </div>
                <p className="text-sm leading-6 text-white/75">{currentCopy.body}</p>
              </div>

              {showComplete && detectionState === "ready" ? (
                <div className="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 animate-pulse">
                  Analysis complete
                </div>
              ) : null}

              <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="rounded-full bg-white/12 px-4 py-3 text-sm backdrop-blur">
                  {cameraState === "ready"
                    ? "Keep the flower inside the center guide until the classifier stabilizes."
                    : permissionCopy[cameraState]}
                </div>

                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-petal-moss transition hover:bg-petal-cream"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Restart camera
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Photo upload</span>
                <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                  {uploadName ?? "No file"}
                </span>
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-full border border-white/20 px-4 py-3 text-sm text-white/80">
                <span>Select a flower photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                onClick={() => void runUploadAnalysis()}
                disabled={!uploadPreview || uploadBusy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-petal-moss transition hover:bg-petal-cream disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Analyze uploaded photo
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-petal-moss/10 bg-white p-6 shadow-bloom">
              <div className="mb-4 flex items-center gap-3">
                <ScanSearch className="h-5 w-5 text-petal-sage" />
                <h2 className="font-heading text-3xl">Detection flow</h2>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Camera",
                    value:
                      cameraState === "ready"
                        ? "Permission granted and live stream connected."
                        : permissionCopy[cameraState]
                  },
                  {
                    label: "Model",
                    value: visionReady
                      ? displayInsight?.modelSource === "flower-checkpoint"
                        ? "The repo checkpoint is active."
                        : "MobileNet fallback is active until a local checkpoint is added."
                      : "The classifier is still loading."
                  },
                  {
                    label: "Flower hint",
                    value: displayInsight
                      ? `${displayInsight.flowerLabel}, confidence ${Math.round(
                          displayInsight.confidence * 100
                        )}%`
                      : "No stable flower prediction has been detected yet."
                  }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-[#f4efe8] px-4 py-4 text-sm text-petal-moss/80"
                  >
                    <p className="mb-1 text-xs uppercase tracking-[0.25em] text-petal-sage">
                      {item.label}
                    </p>
                    <p className="leading-6">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-petal-moss/10 bg-white p-6 shadow-bloom">
              <div className="mb-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-petal-sage" />
                <h2 className="font-heading text-3xl">Live classifier insight</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Confidence"
                  value={displayInsight ? `${Math.round(displayInsight.confidence * 100)}%` : "--"}
                />
                <MetricCard
                  label="Brightness"
                  value={displayInsight ? displayInsight.brightness.toFixed(2) : "--"}
                />
                <MetricCard
                  label="Dominant"
                  value={displayInsight ? displayInsight.dominantHex : "--"}
                />
                <MetricCard
                  label="Family"
                  value={
                    displayInsight
                      ? normalizedFamily
                        ? normalizedFamily
                        : "unmapped"
                      : "--"
                  }
                />
              </div>
              {!frameInsight && lastInsight ? (
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-petal-sage">
                  Showing last analysis snapshot
                </p>
              ) : null}

              {activeSuggestion ? (
                <div className="mt-4 rounded-[1.5rem] bg-[#faf7f2] p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-petal-sage">
                    Suggested local mapping
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-heading text-3xl">{activeSuggestion.name}</p>
                      <p className="mt-2 text-sm leading-6 text-petal-moss/75">
                        {activeSuggestion.flower_language}
                      </p>
                    </div>
                    <span
                      className="h-14 w-14 rounded-full border border-petal-moss/10"
                      style={{
                        backgroundColor: activeSuggestion.interior_guide.mood_color
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {displayInsight?.predictions?.length ? (
                <div className="mt-4 rounded-[1.5rem] bg-[#faf7f2] p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-petal-sage">
                    Top predictions
                  </p>
                  <div className="mt-3 space-y-2">
                    {displayInsight.predictions.slice(0, 3).map((prediction) => (
                      <PredictionRow key={prediction.className} prediction={prediction} />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-petal-moss/10 bg-white p-6 shadow-bloom">
              <div className="mb-4 flex items-center gap-3">
                <Wand2 className="h-5 w-5 text-petal-sage" />
                <h2 className="font-heading text-3xl">Result card</h2>
              </div>

              {result ? (
                <div className="space-y-4 rounded-[1.5rem] bg-[#faf7f2] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em] text-petal-sage">
                        <span>
                          {resultSource === "api" ? "Python API Result" : "Local Preview Result"}
                        </span>
                        {resultBadge ? (
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-petal-moss">
                            {resultBadge}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-heading text-4xl">{result.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-petal-moss/75">
                        Flower meaning: {result.flower_language}
                      </p>
                    </div>
                    <span
                      className="h-14 w-14 rounded-full border border-petal-moss/10"
                      style={{ backgroundColor: result.interior_guide.mood_color }}
                    />
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-petal-sage">
                      Style
                    </p>
                    <p className="mt-2 text-sm">
                      {result.interior_guide?.style ?? "Not available"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-petal-sage">
                      Placement
                    </p>
                    <p className="mt-2 text-sm leading-6">
                      {result.interior_guide?.placement ?? "Not available"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-petal-sage">
                      Mood color
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm">
                        {result.interior_guide?.mood_color ?? "Not available"}
                      </span>
                      <span
                        className="h-10 w-10 rounded-full border border-petal-moss/10"
                        style={{
                          backgroundColor:
                            result.interior_guide?.mood_color ?? "#f4efe8"
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] bg-[#faf7f2] p-5 text-sm leading-6 text-petal-moss/75">
                  Once the flower stays inside the center guide for a few stable
                  classifier passes, the frontend captures the frame and asks the
                  backend for the final guide response.
                </div>
              )}

              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {errorMessage}
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f4efe8] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.25em] text-petal-sage">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-petal-moss">{value}</p>
    </div>
  );
}

function PredictionRow({ prediction }: { prediction: FlowerPrediction }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm">
      <span className="max-w-[70%] truncate">{prediction.className}</span>
      <span className="font-medium text-petal-sage">
        {Math.round(prediction.probability * 100)}%
      </span>
    </div>
  );
}

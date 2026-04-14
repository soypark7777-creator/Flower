import type { FlowerAnalysisResponse } from "@/lib/types";

const suggestions: Record<string, FlowerAnalysisResponse> = {
  peony: {
    name: "Peony",
    flower_language: "A soft heart and thoughtful care",
    interior_guide: {
      style: "Minimalistic & Warm",
      placement: "Place it in a low vase on a wood side table touched by afternoon light",
      mood_color: "#f4cfd7"
    }
  },
  sunflower: {
    name: "Sunflower",
    flower_language: "Joy, confidence, and bright energy",
    interior_guide: {
      style: "Sunny Natural",
      placement: "Use it as a bright focal point at the center of a dining table",
      mood_color: "#f6c453"
    }
  },
  hydrangea: {
    name: "Hydrangea",
    flower_language: "Sincerity and deepening emotion",
    interior_guide: {
      style: "Soft Contemporary",
      placement: "Set it on a rounded table beside a calm fabric sofa for volume",
      mood_color: "#9db7e8"
    }
  },
  tulip: {
    name: "Tulip",
    flower_language: "A fresh beginning and clear delight",
    interior_guide: {
      style: "Clean Scandinavian",
      placement: "Arrange it in a slim glass vase near a bright window shelf",
      mood_color: "#ff8e8e"
    }
  },
  lily: {
    name: "Lily",
    flower_language: "Purity and a calm presence",
    interior_guide: {
      style: "Calm Serenity",
      placement: "Keep just one or two stems on a bedside table with generous empty space",
      mood_color: "#f3efe6"
    }
  },
  daisy: {
    name: "Daisy",
    flower_language: "Innocence and a bright open heart",
    interior_guide: {
      style: "Soft Cottage",
      placement: "Scatter a few stems in a clear vase near a breakfast nook window",
      mood_color: "#f5ead6"
    }
  },
  rose: {
    name: "Rose",
    flower_language: "Affection, admiration, and romance",
    interior_guide: {
      style: "Classic Romantic",
      placement: "Use a short ceramic vase as a centerpiece on a warm-toned console",
      mood_color: "#cf5d72"
    }
  },
  iris: {
    name: "Iris",
    flower_language: "Hope, wisdom, and elegant courage",
    interior_guide: {
      style: "Gallery Calm",
      placement: "Place it in a tall matte vase near books and framed art",
      mood_color: "#7d87d9"
    }
  },
  lotus: {
    name: "Lotus",
    flower_language: "Clarity and serene resilience",
    interior_guide: {
      style: "Zen Natural",
      placement: "Keep the arrangement low and quiet on a wide stone or wood surface",
      mood_color: "#f2d7dd"
    }
  }
};

export function getLocalFlowerSuggestion(label?: string) {
  const key = normalizeFlowerLabel(label);
  if (key && suggestions[key]) {
    return suggestions[key];
  }

  return createFallbackSuggestion(label);
}

export function normalizeFlowerLabel(label?: string) {
  const normalized = label?.toLowerCase().trim() ?? "";

  if (!normalized) {
    return "";
  }

  if (normalized.includes("sunflower")) {
    return "sunflower";
  }

  if (normalized.includes("daisy")) {
    return "daisy";
  }

  if (normalized.includes("rose")) {
    return "rose";
  }

  if (normalized.includes("iris")) {
    return "iris";
  }

  if (normalized.includes("lotus")) {
    return "lotus";
  }

  if (normalized.includes("lily")) {
    return "lily";
  }

  if (normalized.includes("tulip")) {
    return "tulip";
  }

  if (normalized.includes("hydrangea")) {
    return "hydrangea";
  }

  if (normalized.includes("peony")) {
    return "peony";
  }

  if (normalized.includes("rapeseed") || normalized.includes("yellow lady's slipper")) {
    return "sunflower";
  }

  if (normalized.includes("crocus")) {
    return "iris";
  }

  return "";
}

function createFallbackSuggestion(label?: string): FlowerAnalysisResponse {
  const formatted = formatLabel(label);

  return {
    name: formatted,
    flower_language: "Quiet presence and a gentle lift to the room.",
    interior_guide: {
      style: "Soft Natural",
      placement:
        "Use a simple vase near warm light so the petals can stay the focus.",
      mood_color: "#e9d9d5"
    }
  };
}

function formatLabel(label?: string) {
  const trimmed = label?.trim();

  if (!trimmed) {
    return "Unknown Flower";
  }

  return trimmed
    .split(/[\s_-]+/)
    .map((word) => {
      const lower = word.toLowerCase();
      return lower ? `${lower[0].toUpperCase()}${lower.slice(1)}` : "";
    })
    .filter(Boolean)
    .join(" ");
}

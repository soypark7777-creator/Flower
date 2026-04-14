export type FlowerAnalysisResponse = {
  name: string;
  flower_language: string;
  interior_guide: {
    style: string;
    placement: string;
    mood_color: string;
  };
};

export type FlowerAnalysisRequest = {
  flowerHint?: string;
  dominantColor?: string;
  confidence?: number;
  imageBase64?: string;
  imageMimeType?: string;
};

export type FlowerPrediction = {
  className: string;
  probability: number;
};

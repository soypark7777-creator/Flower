import { getLocalFlowerSuggestion } from "@/lib/mock-analysis";
import type { FlowerAnalysisRequest, FlowerAnalysisResponse } from "@/lib/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchFlowerAnalysis(
  payload: FlowerAnalysisRequest = {}
): Promise<FlowerAnalysisResponse> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const endpoint = apiBase ? `${apiBase}/api/analyze` : "/api/analyze";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Failed to fetch flower analysis.");
    }

    return (await response.json()) as FlowerAnalysisResponse;
  } catch {
    await sleep(700);
    return getLocalFlowerSuggestion(payload.flowerHint);
  }
}

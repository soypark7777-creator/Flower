// Gemini 1.5 Pro를 사용하여 이미지를 분석하고 꽃 이름, 꽃말, 인테리어 팁을 JSON으로 반환하는 POST 핸들러를 작성해줘
import { NextRequest, NextResponse } from "next/server";

const pythonBaseUrl = process.env.PYTHON_API_BASE_URL?.trim() || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${pythonBaseUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach the Python analysis backend.";

    return NextResponse.json({ detail: message }, { status: 502 });
  }
}

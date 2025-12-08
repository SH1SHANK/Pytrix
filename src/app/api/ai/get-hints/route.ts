/**
 * Get Hints API Route
 *
 * POST /api/ai/get-hints
 *
 * Headers:
 *   X-API-Key: <user's Gemini API key>
 *
 * Body:
 *   { question: Question, code: string, hintsCount: number }
 *
 * Returns:
 *   { hint: Hint, usage: { model, inputTokens, outputTokens } }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "@/lib/ai/modelRouter";
import { Question } from "@/lib/types";
import { Hint } from "@/lib/types/Hint";

export async function POST(request: NextRequest) {
  try {
    // Extract API key from header
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required", errorType: "api_key_required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { question, code, hintsCount } = body as {
      question: Question;
      code: string;
      hintsCount: number;
    };

    if (!question || code === undefined) {
      return NextResponse.json(
        { error: "Missing question or code" },
        { status: 400 }
      );
    }

    const level = (hintsCount || 0) + 1;

    const prompt = `
You are a Python Tutor providing hints.
Problem: ${question.title}
Description: ${question.description}
User Code:
\`\`\`python
${code}
\`\`\`

The user is stuck. Provide a Hint Level ${level} (1 = gentle nudge, 2 = more specific but don't give the answer).

Return ONLY a raw JSON object:
{
  "hint": "The actual hint string.",
  "level": ${level}
}
`;

    const result: AIResult<Hint> = await callGeminiWithFallback(
      apiKey,
      "hint",
      prompt,
      parseJsonResponse<Hint>
    );

    if (result.success && result.data) {
      return NextResponse.json({
        hint: result.data,
        usage: {
          model: result.modelUsed,
          inputTokens: result.usage?.inputTokens || 0,
          outputTokens: result.usage?.outputTokens || 0,
        },
      });
    }

    // Handle specific error types
    if (
      result.errorType === "api_key_required" ||
      result.errorType === "config_error"
    ) {
      return NextResponse.json(
        { error: result.message, errorType: result.errorType },
        { status: 401 }
      );
    }

    // Fallback hint
    return NextResponse.json({
      hint: {
        hint: "Try checking the problem constraints and ensure your logic handles edge cases.",
        level: level,
      },
      usage: null,
      fallback: true,
    });
  } catch (error) {
    console.error("[get-hints] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

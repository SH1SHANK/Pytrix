/**
 * Reveal Solution API Route
 *
 * POST /api/ai/reveal-solution
 *
 * Headers:
 *   X-API-Key: <user's Gemini API key>
 *
 * Body:
 *   { question: Question, failedAttempts: number }
 *
 * Returns:
 *   { referenceSolution: string, usage: { model, inputTokens, outputTokens } }
 */

import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback, AIResult } from "@/lib/ai/modelRouter";
import { Question } from "@/lib/types";

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
    const { question, failedAttempts, hintsUsed } = body as {
      question: Question;
      failedAttempts: number;
      hintsUsed?: number;
    };

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // Guard: require at least 2 failed attempts OR 2 hints used
    if (failedAttempts < 2 && (hintsUsed || 0) < 2) {
      return NextResponse.json(
        { error: "Cannot reveal solution yet. Keep trying!" },
        { status: 400 }
      );
    }

    // If we already have a solution cached in the question, return it
    if (question.referenceSolution) {
      return NextResponse.json({
        referenceSolution: question.referenceSolution,
        usage: null,
        cached: true,
      });
    }

    // Generate solution on demand
    const prompt = `
You are an expert Python coder.
Problem: ${question.title}
Description: ${question.description}

Provide the OPTIMAL Python reference solution.
Return ONLY the raw Python code (no markdown, no explanation).
`;

    const result: AIResult<string> = await callGeminiWithFallback(
      apiKey,
      "reveal-solution",
      prompt
      // No JSON parser - we want raw text
    );

    if (result.success && result.data) {
      // Clean up any accidental markdown
      const solution = result.data
        .replace(/```python\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      return NextResponse.json({
        referenceSolution: solution,
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

    // Fallback
    return NextResponse.json({
      referenceSolution: "# Error generating solution. Please try again later.",
      usage: null,
      fallback: true,
    });
  } catch (error) {
    console.error("[reveal-solution] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

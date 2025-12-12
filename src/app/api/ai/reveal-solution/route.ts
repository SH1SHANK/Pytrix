/**
 * Reveal Solution API Route
 *
 * POST /api/ai/reveal-solution
 *
 * Headers:
 *   X-API-Key: <user's Gemini API key>
 *
 * Body:
 *   {
 *     question: Question,
 *     failedAttempts: number,
 *     hintsUsed?: number,
 *     solutionMode?: "thorough" | "direct",
 *     skipGuard?: boolean  // For Auto Mode - skip attempt/hint requirements
 *   }
 *
 * Returns:
 *   {
 *     referenceSolution: string,
 *     explanation?: string,  // Only for thorough mode
 *     usage: { model, inputTokens, outputTokens }
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback, AIResult } from "@/lib/ai/modelRouter";
import { Question } from "@/lib/types";

export type SolutionMode = "thorough" | "direct";

interface RevealSolutionRequest {
  question: Question;
  failedAttempts: number;
  hintsUsed?: number;
  solutionMode?: SolutionMode;
  skipGuard?: boolean;
}

/**
 * Build the prompt based on solution mode
 */
function buildPrompt(question: Question, mode: SolutionMode): string {
  if (mode === "direct") {
    return `You are an expert Python coder.
Problem: ${question.title}
Description: ${question.description}
${question.constraints ? `Constraints: ${question.constraints.join(", ")}` : ""}

Provide a clean, working Python solution.
Return ONLY the raw Python code with minimal inline comments.
Do NOT include markdown code blocks, explanations, or any text outside the code.
The code should be ready to copy-paste and run.`;
  }

  // Thorough mode - comprehensive explanation
  return `You are an expert Python tutor helping a student learn algorithms.
Problem: ${question.title}
Description: ${question.description}
${question.constraints ? `Constraints: ${question.constraints.join(", ")}` : ""}

Provide a THOROUGH solution with:
1. A brief algorithm approach explanation as comments at the top
2. Step-by-step breakdown of the logic as inline comments
3. Well-commented, production-quality Python code
4. Time and space complexity as comments at the end

Format your response as Python code with detailed comments explaining each step.
Do NOT use markdown code blocks - return raw Python code only.
Make the comments educational and helpful for someone learning this algorithm.`;
}

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
    const {
      question,
      failedAttempts,
      hintsUsed,
      solutionMode = "thorough",
      skipGuard = false,
    } = body as RevealSolutionRequest;

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // Guard: require at least 2 failed attempts OR 2 hints used
    // Skip this check if skipGuard is true (Auto Mode)
    if (!skipGuard && failedAttempts < 2 && (hintsUsed || 0) < 2) {
      return NextResponse.json(
        { error: "Cannot reveal solution yet. Keep trying!" },
        { status: 400 }
      );
    }

    // If we already have a solution cached in the question AND mode is direct, return it
    // For thorough mode, we always generate fresh to get the explanation
    if (question.referenceSolution && solutionMode === "direct") {
      return NextResponse.json({
        referenceSolution: question.referenceSolution,
        usage: null,
        cached: true,
      });
    }

    // Generate solution on demand
    const prompt = buildPrompt(question, solutionMode);

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
        solutionMode,
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

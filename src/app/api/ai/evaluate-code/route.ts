/**
 * Evaluate Code API Route
 *
 * POST /api/ai/evaluate-code
 *
 * Headers:
 *   X-API-Key: <user's Gemini API key>
 *
 * Body:
 *   { question: Question, code: string, output?: string, error?: string }
 *
 * Returns:
 *   { evaluation: CodeEvaluation, usage: { model, inputTokens, outputTokens } }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "@/lib/ai/modelRouter";
import { Question } from "@/lib/types";

interface CodeEvaluation {
  isCorrect: boolean;
  feedback: string;
  suggestions?: string[];
  score?: number;
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
      code,
      output,
      error: execError,
    } = body as {
      question: Question;
      code: string;
      output?: string;
      error?: string;
    };

    if (!question || code === undefined) {
      return NextResponse.json(
        { error: "Missing question or code" },
        { status: 400 }
      );
    }

    const prompt = `
You are a Python code reviewer evaluating a student's solution.

Problem: ${question.title}
Description: ${question.description}
Expected Output Format: ${question.outputDescription}
Sample Input: ${question.sampleInput}
Sample Output: ${question.sampleOutput}

Student's Code:
\`\`\`python
${code}
\`\`\`

${output ? `Execution Output:\n${output}` : ""}
${execError ? `Execution Error:\n${execError}` : ""}

Evaluate the code and return ONLY a raw JSON object:
{
  "isCorrect": true/false,
  "feedback": "Detailed feedback about the solution",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "score": 0-100
}
`;

    const result: AIResult<CodeEvaluation> = await callGeminiWithFallback(
      apiKey,
      "code-feedback",
      prompt,
      parseJsonResponse<CodeEvaluation>
    );

    if (result.success && result.data) {
      return NextResponse.json({
        evaluation: result.data,
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

    // Fallback evaluation
    return NextResponse.json({
      evaluation: {
        isCorrect: false,
        feedback: "Could not evaluate code at this time. Please try again.",
        suggestions: [],
        score: 0,
      },
      usage: null,
      fallback: true,
    });
  } catch (error) {
    console.error("[evaluate-code] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

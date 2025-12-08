/**
 * Optimize Solution API Route
 *
 * POST /api/ai/optimize-solution
 *
 * Headers:
 *   X-API-Key: <user's Gemini API key>
 *
 * Body:
 *   { question: Question, userCode: string }
 *
 * Returns:
 *   { optimized: OptimizedSolution | null, usage: { model, inputTokens, outputTokens } }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "@/lib/ai/modelRouter";
import { Question } from "@/lib/types";

interface OptimizedSolution {
  code: string;
  explanation: string;
  keyImprovements: string[];
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
    const { question, userCode } = body as {
      question: Question;
      userCode: string;
    };

    if (!question || !userCode) {
      return NextResponse.json(
        { error: "Missing question or userCode" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert Python code reviewer.

The user has solved this problem correctly:

Problem: ${question.title}
Description: ${question.description}
Sample Input: ${question.sampleInput}
Sample Output: ${question.sampleOutput}

User's Correct Solution:
\`\`\`python
${userCode}
\`\`\`

Your task:
1. Provide a more optimal or idiomatic Python solution.
2. Include inline comments explaining key improvements.
3. Focus on: readability, Pythonic idioms, time/space complexity.

Return ONLY a raw JSON object with this schema:
{
  "code": "Complete Python function with inline comments for key improvements",
  "explanation": "Brief summary of what makes this solution better",
  "keyImprovements": ["improvement 1", "improvement 2", ...]
}
`;

    const result: AIResult<OptimizedSolution> = await callGeminiWithFallback(
      apiKey,
      "hint", // Use cheapest model tier
      prompt,
      parseJsonResponse<OptimizedSolution>
    );

    if (result.success && result.data) {
      return NextResponse.json({
        optimized: result.data,
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

    // Return null for optimization failures (graceful degradation)
    return NextResponse.json({
      optimized: null,
      usage: null,
    });
  } catch (error) {
    console.error("[optimize-solution] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

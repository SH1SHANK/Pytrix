"use server";

import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "./modelRouter";
import { Question } from "@/lib/types";
import { EvaluationResult } from "../types/Evaluation";

export async function evaluateCode(
  question: Question,
  code: string
): Promise<EvaluationResult> {
  const prompt = `
You are a Python Code Evaluator.

Problem: ${question.title}
Description: ${question.description}
Constraints: ${(question.constraints || []).join(", ")}
Sample Input: ${question.sampleInput}
Sample Output: ${question.sampleOutput}

User Code:
\`\`\`python
${code}
\`\`\`

Task:
1. Analyze the user's code logic.
2. Verify if it correctly solves the problem described.
3. Check for edge cases and constraints.
4. Simulate running the code against the Sample Input.

Return ONLY a raw JSON object with this schema:
{
  "status": "correct" | "incorrect" | "error",
  "explanation": "Concise feedback on what works or why it fails.",
  "expectedBehavior": "What the code should have done (if incorrect).",
  "nextHint": "A small nudge if incorrect (optional, null if correct)."
}
`;

  const result: AIResult<EvaluationResult> = await callGeminiWithFallback(
    "code-feedback",
    prompt,
    parseJsonResponse<EvaluationResult>
  );

  if (result.success && result.data) {
    return result.data;
  }

  // Return structured error - NOT a generic "check your logic" message
  console.warn("[evaluateCode] AI failed:", result.message);

  if (result.errorType === "ai_unavailable") {
    return {
      status: "error",
      explanation:
        "All AI backends are currently unavailable. Please try again in a moment.",
      expectedBehavior: "",
      nextHint: null,
    };
  }

  return {
    status: "error",
    explanation: result.message || "Failed to evaluate code. Please try again.",
    expectedBehavior: "",
    nextHint: null,
  };
}

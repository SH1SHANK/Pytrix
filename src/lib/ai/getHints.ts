"use server";

import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "./modelRouter";
import { Question } from "@/lib/types";
import { Hint } from "../types/Hint";

export async function getHints(
  question: Question,
  code: string,
  hintsCount: number // 0 = first hint needed, 1 = second hint needed
): Promise<Hint> {
  const level = hintsCount + 1;

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
    "hint",
    prompt,
    parseJsonResponse<Hint>
  );

  if (result.success && result.data) {
    return result.data;
  }

  // Fallback hint
  console.warn("[getHints] AI failed:", result.message);
  return {
    hint: "Try checking the problem constraints and ensure your logic handles edge cases.",
    level: hintsCount + 1,
  };
}

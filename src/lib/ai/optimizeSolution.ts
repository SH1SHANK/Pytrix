"use server";

import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "./modelRouter";
import { Question } from "@/lib/types";

interface OptimizedSolution {
  code: string;
  explanation: string;
  keyImprovements: string[];
}

/**
 * Get an optimized/idiomatic solution for a correct answer.
 * Uses the cheapest model (flash-lite) to minimize costs.
 *
 * @param question - The problem being solved
 * @param userCode - The user's correct solution
 * @returns Optimized code with comments and explanation
 */
export async function optimizeSolution(
  question: Question,
  userCode: string
): Promise<OptimizedSolution | null> {
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
    "hint", // Use cheapest model tier
    prompt,
    parseJsonResponse<OptimizedSolution>
  );

  if (result.success && result.data) {
    return result.data;
  }

  console.warn("[optimizeSolution] AI failed:", result.message);
  return null;
}

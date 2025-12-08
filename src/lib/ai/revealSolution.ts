"use server";

import { callGeminiWithFallback, AIResult } from "./modelRouter";
import { Question } from "@/lib/types";

export async function revealSolution(
  question: Question,
  failedAttempts: number
): Promise<{ referenceSolution: string }> {
  // Guard: require at least 2 failed attempts
  if (failedAttempts < 2) {
    throw new Error("Cannot reveal solution yet. Keep trying!");
  }

  // If we already have a solution cached in the question, return it
  if (question.referenceSolution) {
    return { referenceSolution: question.referenceSolution };
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

    return { referenceSolution: solution };
  }

  // Fallback
  console.warn("[revealSolution] AI failed:", result.message);
  return {
    referenceSolution: "# Error generating solution. Please try again later.",
  };
}

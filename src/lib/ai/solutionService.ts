/**
 * Solution Service
 *
 * Handles lazy generation of optimal solutions.
 * Only generates when user explicitly requests after solving correctly.
 * Caches results per question ID.
 */

"use server";

import { Question } from "@/lib/types";
import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "./modelRouter";

// ============================================
// TYPES
// ============================================

export interface OptimizedSolution {
  code: string;
  explanation: string;
  keyImprovements: string[];
}

// ============================================
// IN-MEMORY CACHE
// ============================================

// Cache solutions by questionId to prevent duplicate calls
const solutionCache = new Map<string, OptimizedSolution>();

// ============================================
// API
// ============================================

/**
 * Get an optimized/idiomatic solution for a correct answer.
 * Uses caching to prevent duplicate API calls for the same question.
 *
 * @param question - The problem being solved
 * @param userCode - The user's correct solution
 * @returns Optimized solution, or null if generation fails
 */
export async function getOptimalSolution(
  question: Question,
  userCode: string
): Promise<OptimizedSolution | null> {
  // Check cache first
  if (solutionCache.has(question.id)) {
    console.log(`[SolutionService] Cache hit for ${question.id}`);
    return solutionCache.get(question.id)!;
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
    "hint", // Use cheapest model tier
    prompt,
    parseJsonResponse<OptimizedSolution>
  );

  if (result.success && result.data) {
    // Cache the result
    solutionCache.set(question.id, result.data);
    console.log(`[SolutionService] Generated and cached for ${question.id}`);
    return result.data;
  }

  console.warn("[SolutionService] AI failed:", result.message);
  return null;
}

/**
 * Check if a solution is already cached for a question.
 */
export function hasCachedSolution(questionId: string): boolean {
  return solutionCache.has(questionId);
}

/**
 * Get cached solution without making API call.
 */
export function getCachedSolution(
  questionId: string
): OptimizedSolution | null {
  return solutionCache.get(questionId) || null;
}

/**
 * Clear solution cache (for testing).
 */
export function clearSolutionCache(): void {
  solutionCache.clear();
}

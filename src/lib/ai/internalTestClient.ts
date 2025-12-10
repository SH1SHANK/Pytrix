"use server";

import { callGeminiWithFallback } from "@/lib/ai/modelRouter";
import type { TaskType } from "@/lib/ai/modelRouter";

/**
 * INTERNAL TEST CLIENT
 *
 * This module is for internal development and agentic testing ONLY.
 * It provides access to the internal Gemini key defined in .env.local
 * for running QA checks, migrations, and diagnostics.
 *
 * SECURITY RULES:
 * 1. Server-side only ("use server").
 * 2. Key must never leak to client.
 * 3. Disabled in production.
 */

const INTERNAL_KEY = process.env.INTERNAL_GEMINI_KEY;
const IS_DEV = process.env.NODE_ENV === "development";

export async function getInternalClient() {
  if (!IS_DEV) {
    throw new Error("Internal client is disabled in production.");
  }

  if (!INTERNAL_KEY) {
    console.warn(
      "[InternalTestClient] No INTERNAL_GEMINI_KEY found. Skipping test."
    );
    return null;
  }

  return {
    /**
     * Generate content using the internal developer key.
     */
    generateContent: async <T>(
      task: TaskType,
      prompt: string,
      parser?: (text: string) => T,
      options?: { difficulty?: "beginner" | "intermediate" | "advanced" }
    ) => {
      // Security check again just in case
      if (process.env.NODE_ENV !== "development") {
        throw new Error("Internal calls blocked in production");
      }

      console.log(`[InternalClient] calling Gemini for task: ${task}`);

      return callGeminiWithFallback<T>(
        INTERNAL_KEY,
        task,
        prompt,
        parser,
        options?.difficulty
      );
    },
  };
}

/**
 * Helper to check if internal generic testing is available
 */
export async function isInternalCheckAvailable(): Promise<boolean> {
  return IS_DEV && !!INTERNAL_KEY;
}

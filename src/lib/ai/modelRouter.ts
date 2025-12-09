/**
 * Model Router - Intelligent Fallback System
 *
 * Cost-aware version:
 * - Prefer gemini-2.5-flash-lite for most tasks (cheapest, still strong).
 * - Use gemini-2.5-flash when we need more reasoning but still relatively cheap.
 * - Use gemini-2.5-pro only for rare, high-value tasks (e.g., reveal-solution).
 *
 * All AI calls should go through `callGeminiWithFallback()`.
 *
 * ## BYOK Support
 * - callGeminiWithFallback() requires an apiKey parameter
 * - If no key provided, returns an error result (does not throw)
 * - Usage is recorded via callback function passed by caller
 */

import {
  getModelWithKey,
  isRateLimitError,
  isConfigurationError,
  ApiKeyRequiredError,
} from "./geminiClient";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type TaskType =
  | "question-generation"
  | "code-feedback"
  | "hint"
  | "auto-mode"
  | "reveal-solution";

export interface AIResult<T = unknown> {
  success: boolean;
  data?: T;
  errorType?:
    | "rate_limit"
    | "config_error"
    | "parse_error"
    | "ai_unavailable"
    | "api_key_required";
  message?: string;
  modelUsed?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============================================
// MODEL PRIORITY CONFIGURATION (COST-AWARE)
// ============================================

/**
 * Model priority lists per task type.
 * First model in list = preferred, subsequent = fallbacks.
 *
 * Strategy:
 * - Default to gemini-2.5-flash-lite for high-volume tasks
 *   (cheapest, free in free tier).
 * - Use gemini-2.5-flash when we want stronger reasoning.
 * - Reserve gemini-2.5-pro for rare, high-value calls only
 *   (e.g., reveal-solution).
 */
const MODEL_PRIORITIES: Record<TaskType, string[]> = {
  // Many calls, structured text, not insanely hard reasoning.
  "question-generation": ["gemini-2.5-flash-lite", "gemini-2.5-flash"],

  // Needs decent reasoning about code, but we still want to avoid Pro
  // for most traffic. Pro can be added as a third option if needed.
  "code-feedback": [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    // "gemini-2.5-pro", // uncomment if you want an extra high-quality fallback
  ],

  // Lots of calls, very low risk to use the cheapest model.
  hint: ["gemini-2.5-flash-lite", "gemini-2.5-flash"],

  // Very lightweight metadata decisions: cheapest model is ideal.
  "auto-mode": ["gemini-2.5-flash-lite", "gemini-2.5-flash"],

  // Rare, user-triggered, high value: OK to use Pro here.
  "reveal-solution": [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ],
};

// ============================================
// IN-MEMORY USAGE TRACKING
// ============================================

interface ModelUsageState {
  recentRateLimitCount: number;
  lastRateLimitAt: number | null;
}

const modelUsageState: Record<string, ModelUsageState> = {};

/**
 * Cooldown duration in milliseconds.
 * Models that recently hit rate limits will be deprioritized.
 */
const COOLDOWN_MS = 60_000; // 1 minute

function recordRateLimit(modelName: string): void {
  if (!modelUsageState[modelName]) {
    modelUsageState[modelName] = {
      recentRateLimitCount: 0,
      lastRateLimitAt: null,
    };
  }
  modelUsageState[modelName].recentRateLimitCount++;
  modelUsageState[modelName].lastRateLimitAt = Date.now();

  console.warn(
    `[ModelRouter] Rate limit recorded for ${modelName}. Total: ${modelUsageState[modelName].recentRateLimitCount}`
  );
}

function isModelCoolingDown(modelName: string): boolean {
  const info = modelUsageState[modelName];
  if (!info || !info.lastRateLimitAt) return false;
  return Date.now() - info.lastRateLimitAt < COOLDOWN_MS;
}

// ============================================
// CORE ROUTING FUNCTION
// ============================================

/**
 * Get the priority-ordered list of models for a task,
 * with cooling-down models pushed to the end.
 */
import { type Difficulty } from "@/types/question";

export function getModelPriorityList(
  task: TaskType,
  difficulty?: Difficulty
): string[] {
  // Default to the cheapest general-purpose model if task is unknown.
  let baseList = MODEL_PRIORITIES[task] || ["gemini-2.5-flash-lite"];

  // Adjust prioritization based on difficulty
  if (difficulty === "beginner" && task === "question-generation") {
    // Prefer Lite for easy questions
    baseList = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  } else if (difficulty === "advanced" && task === "question-generation") {
    // Prefer Flash (standard) for advanced questions for better reasoning
    baseList = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
  }

  const available: string[] = [];
  const coolingDown: string[] = [];

  for (const model of baseList) {
    if (isModelCoolingDown(model)) {
      coolingDown.push(model);
    } else {
      available.push(model);
    }
  }

  return [...available, ...coolingDown];
}

/**
 * Main entry point for all Gemini API calls.
 *
 * Handles:
 * - Model fallback on rate limits
 * - Error classification
 * - Cooldown tracking
 * - Response parsing
 *
 * @param apiKey - User's Gemini API key (required)
 * @param task - The task type for model selection
 * @param prompt - The prompt string to send
 * @param parseResponse - Optional function to parse/validate the response
 * @param difficulty - Optional difficulty level to optimize model selection
 */
export async function callGeminiWithFallback<T>(
  apiKey: string,
  task: TaskType,
  prompt: string,
  parseResponse?: (text: string) => T,
  difficulty?: Difficulty
): Promise<AIResult<T>> {
  // Check for API key first
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      success: false,
      errorType: "api_key_required",
      message:
        "LLM features require your own API key. Configure it in Settings → API & Keys.",
    };
  }

  const models = getModelPriorityList(task, difficulty);

  for (const modelName of models) {
    try {
      const model = getModelWithKey(apiKey, modelName);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let data: T;
      if (parseResponse) {
        try {
          data = parseResponse(text);
        } catch (parseError) {
          console.error(
            `[ModelRouter] Parse error with ${modelName}:`,
            parseError
          );
          // Try next model - maybe it produces better structured output
          continue;
        }
      } else {
        data = text as unknown as T;
      }

      // Estimate token counts (rough: ~4 chars per token)
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(text.length / 4);

      return {
        success: true,
        data,
        modelUsed: modelName,
        usage: {
          inputTokens,
          outputTokens,
        },
      };
    } catch (error) {
      console.error(`[ModelRouter] Error with ${modelName}:`, error);

      // Check for API key errors first
      if (error instanceof ApiKeyRequiredError) {
        return {
          success: false,
          errorType: "api_key_required",
          message: error.message,
        };
      }

      if (isConfigurationError(error)) {
        return {
          success: false,
          errorType: "config_error",
          message:
            "API configuration error. Check your API key and permissions.",
        };
      }

      if (isRateLimitError(error)) {
        recordRateLimit(modelName);
        continue;
      }

      // Unknown error - try next model
      continue;
    }
  }

  console.error(`[ModelRouter] All models exhausted for task: ${task}`);

  return {
    success: false,
    errorType: "ai_unavailable",
    message:
      "All AI backends are currently unavailable. Please try again soon.",
  };
}

// ============================================
// JSON PARSING HELPER
// ============================================

/**
 * Standard JSON parser that handles markdown code blocks.
 */
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Gemini Client - Low-Level SDK Wrapper
 *
 * This module initializes the Google Generative AI client and provides
 * low-level access to models. Use modelRouter.ts for production calls
 * with fallback and cost-aware selection.
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Environment variable loading
// Prefer GEMINI_API_KEY, fallback to GOOGLE_API_KEY for flexibility.
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error(
    "[GeminiClient] CRITICAL: Missing GEMINI_API_KEY or GOOGLE_API_KEY environment variable."
  );
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * Available Gemini Models (cost-aware)
 *
 * We focus on the 2.5 family:
 * - gemini-2.5-flash-lite → cheapest, best for high-volume tasks
 * - gemini-2.5-flash      → best price-performance, good reasoning
 * - gemini-2.5-pro        → powerful, use sparingly for rare, high-value calls
 *
 * 1.5 models are kept as legacy options but are not used by the router by default.
 *
 * Model names must match exactly what the Gemini API exposes.
 */
export const AVAILABLE_MODELS = {
  // 2.5 family (primary)
  "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.5-pro": "gemini-2.5-pro",

  // Legacy / optional 1.5 models (not used in router by default)
  "gemini-1.5-flash": "gemini-1.5-flash",
  "gemini-1.5-pro": "gemini-1.5-pro",
} as const;

export type ModelAlias = keyof typeof AVAILABLE_MODELS;

/**
 * Get a GenerativeModel instance by alias or raw model name.
 *
 * - If the caller passes a known alias (e.g. "gemini-2.5-flash-lite"),
 *   we map it via AVAILABLE_MODELS.
 * - If they pass a full model name directly, we use it as-is.
 */
export function getModel(modelNameOrAlias: string): GenerativeModel {
  const actualModelName =
    (AVAILABLE_MODELS as Record<string, string>)[modelNameOrAlias] ||
    modelNameOrAlias;

  return genAI.getGenerativeModel({ model: actualModelName });
}

/**
 * Check if an error is a rate-limit / quota-exhaustion error.
 * These are retryable with a different model.
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;

  const errorString = String(error);
  const errObj = error as { status?: number; message?: string; code?: string };

  // HTTP 429 or explicit resource exhausted codes
  if (errObj.status === 429) return true;

  const rateLimitPatterns = [
    "429",
    "RESOURCE_EXHAUSTED",
    "Too Many Requests",
    "quota",
    "rate limit",
    "rate-limit",
    "exceeded",
    "limit exceeded",
  ];

  return rateLimitPatterns.some((pattern) =>
    errorString.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Check if an error is a non-retryable configuration/auth error.
 * These should not trigger model fallback; they must be surfaced.
 */
export function isConfigurationError(error: unknown): boolean {
  if (!error) return false;

  const errorString = String(error);
  const errObj = error as { status?: number };

  // Obvious auth/config issues
  if (errObj.status === 401 || errObj.status === 403) return true;

  const configPatterns = [
    "INVALID_ARGUMENT",
    "PERMISSION_DENIED",
    "UNAUTHENTICATED",
    "API_KEY",
    "authentication",
    "unauthorized",
    "project",
    "billing",
  ];

  return configPatterns.some((pattern) =>
    errorString.toLowerCase().includes(pattern.toLowerCase())
  );
}

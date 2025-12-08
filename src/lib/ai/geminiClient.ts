/**
 * Gemini Client - Low-Level SDK Wrapper
 *
 * This module provides factory functions to create Google Generative AI clients
 * with user-provided API keys. Use modelRouter.ts for production calls
 * with fallback and cost-aware selection.
 *
 * ## BYOK (Bring Your Own Key) Architecture
 * - No global client instance - each call creates a client with the provided key
 * - API keys come from client-side storage via apiKeyStore.ts
 * - Keys are passed to API routes via X-API-Key header
 *
 * ## How modelRouter picks up the key
 * - modelRouter.callGeminiWithFallback() accepts an apiKey parameter
 * - It passes this to createGeminiClient() / getModelWithKey()
 * - API routes extract key from request headers and pass to these functions
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

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
 * Error thrown when no API key is provided.
 */
export class ApiKeyRequiredError extends Error {
  constructor() {
    super("API key is required. Please configure your API key in Settings.");
    this.name = "ApiKeyRequiredError";
  }
}

/**
 * Create a GoogleGenerativeAI client with the provided API key.
 *
 * @param apiKey - User's Gemini API key
 * @returns GoogleGenerativeAI instance
 * @throws ApiKeyRequiredError if apiKey is empty
 */
export function createGeminiClient(apiKey: string): GoogleGenerativeAI {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new ApiKeyRequiredError();
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Get a GenerativeModel instance by alias or raw model name.
 *
 * @param apiKey - User's Gemini API key
 * @param modelNameOrAlias - Model alias (e.g., "gemini-2.5-flash-lite") or full name
 * @returns GenerativeModel instance
 * @throws ApiKeyRequiredError if apiKey is empty
 */
export function getModelWithKey(
  apiKey: string,
  modelNameOrAlias: string
): GenerativeModel {
  const genAI = createGeminiClient(apiKey);
  const actualModelName =
    (AVAILABLE_MODELS as Record<string, string>)[modelNameOrAlias] ||
    modelNameOrAlias;

  return genAI.getGenerativeModel({ model: actualModelName });
}

/**
 * Test if an API key is valid by listing available models.
 *
 * @param apiKey - User's Gemini API key to test
 * @returns Object with success status and any error message
 */
export async function testApiKey(apiKey: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: "API key is empty" };
  }

  try {
    const genAI = createGeminiClient(apiKey);
    // Make a minimal API call to validate the key
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    await model.generateContent("Hello");
    return { valid: true };
  } catch (error) {
    const errorString = String(error);

    if (
      errorString.includes("API_KEY") ||
      errorString.includes("401") ||
      errorString.includes("403")
    ) {
      return {
        valid: false,
        error: "Invalid API key. Please check your key and try again.",
      };
    }
    if (errorString.includes("quota") || errorString.includes("429")) {
      // Key is valid but quota exceeded - still counts as valid
      return { valid: true };
    }

    return {
      valid: false,
      error: "Could not verify API key. Please check your connection.",
    };
  }
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

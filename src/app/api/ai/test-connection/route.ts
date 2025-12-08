/**
 * Test Connection API Route
 *
 * POST /api/ai/test-connection
 *
 * Body:
 *   { apiKey: string }
 *
 * OR Header:
 *   X-API-Key: <user's Gemini API key>
 *
 * Returns:
 *   { success: boolean, valid: boolean, error?: string, errorType?: string }
 *
 * Error types:
 *   - INVALID_KEY: API key is invalid (401/403)
 *   - RATE_LIMIT: Key is valid but quota exceeded (still counts as valid)
 *   - NETWORK: Network error, key status unknown
 *   - UNKNOWN: Other error
 */

import { NextRequest, NextResponse } from "next/server";
import {
  testApiKey,
  isRateLimitError,
  isConfigurationError,
} from "@/lib/ai/geminiClient";

export type ApiKeyValidationResult = {
  success: boolean;
  valid: boolean;
  error?: string;
  errorType?: "INVALID_KEY" | "RATE_LIMIT" | "NETWORK" | "UNKNOWN";
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiKeyValidationResult>> {
  try {
    // Extract API key from body OR header
    let apiKey: string | null = null;

    // Try body first
    try {
      const body = await request.json();
      if (body.apiKey && typeof body.apiKey === "string") {
        apiKey = body.apiKey;
      }
    } catch {
      // Body parsing failed, try header
    }

    // Fallback to header
    if (!apiKey) {
      apiKey = request.headers.get("X-API-Key");
    }

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "API key is required",
          errorType: "INVALID_KEY",
        },
        { status: 400 }
      );
    }

    const result = await testApiKey(apiKey.trim());

    return NextResponse.json({
      success: result.valid,
      valid: result.valid,
      error: result.error,
      errorType: result.valid
        ? undefined
        : result.error?.includes("Invalid")
        ? "INVALID_KEY"
        : "UNKNOWN",
    });
  } catch (error) {
    console.error("[test-connection] Error:", error);

    // Determine error type
    let errorType: "INVALID_KEY" | "RATE_LIMIT" | "NETWORK" | "UNKNOWN" =
      "UNKNOWN";
    let errorMessage = "Could not verify API key";

    if (isConfigurationError(error)) {
      errorType = "INVALID_KEY";
      errorMessage = "Invalid API key. Please check your key and try again.";
    } else if (isRateLimitError(error)) {
      // Rate limit means key IS valid, just quota exceeded
      return NextResponse.json({
        success: true,
        valid: true,
        error: "Rate limited, but key is valid",
        errorType: "RATE_LIMIT",
      });
    } else if (error instanceof TypeError && String(error).includes("fetch")) {
      errorType = "NETWORK";
      errorMessage = "Network error. Check your connection and try again.";
    }

    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: errorMessage,
        errorType,
      },
      { status: 500 }
    );
  }
}

import { beforeEach, describe, expect, it, vi } from "vitest";

const { countTokens, getGenerativeModel, GoogleGenerativeAIAbortError } =
  vi.hoisted(() => {
    class GoogleGenerativeAIAbortError extends Error {}
    const countTokens = vi.fn().mockResolvedValue({ totalTokens: 1 });
    const getGenerativeModel = vi.fn(() => ({ countTokens }));
    return { countTokens, getGenerativeModel, GoogleGenerativeAIAbortError };
  });

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = getGenerativeModel;
  },
  GoogleGenerativeAIAbortError,
}));

describe("Gemini API key validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countTokens.mockResolvedValue({ totalTokens: 1 });
  });

  it("checks the low-cost model with a bounded token-count request", async () => {
    const { AVAILABLE_MODELS, testApiKey } = await import(
      "@/lib/ai/geminiClient"
    );

    expect(AVAILABLE_MODELS["gemini-2.0-flash-lite"]).toBe(
      "gemini-3.5-flash-lite"
    );
    await expect(testApiKey("test-api-key")).resolves.toEqual({ valid: true });
    expect(getGenerativeModel).toHaveBeenCalledWith(
      { model: AVAILABLE_MODELS["gemini-2.0-flash-lite"] },
      { timeout: 7_000 }
    );
    expect(countTokens).toHaveBeenCalledWith("Hello");
  });

  it("returns promptly with a clear message when Gemini times out", async () => {
    countTokens.mockRejectedValue(
      new GoogleGenerativeAIAbortError("request timed out")
    );

    const { testApiKey } = await import("@/lib/ai/geminiClient");

    await expect(testApiKey("test-api-key")).resolves.toEqual({
      valid: false,
      error: "Gemini verification timed out after 7 seconds. Try again.",
    });
  });
});

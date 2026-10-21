import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent, getGenerativeModel } = vi.hoisted(() => {
  const generateContent = vi.fn().mockResolvedValue(undefined);
  const getGenerativeModel = vi.fn(() => ({ generateContent }));
  return { generateContent, getGenerativeModel };
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = getGenerativeModel;
  },
}));

describe("Gemini API key validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateContent.mockResolvedValue(undefined);
  });

  it("validates keys with the active low-cost model", async () => {
    const { AVAILABLE_MODELS, testApiKey } = await import(
      "@/lib/ai/geminiClient"
    );

    expect(AVAILABLE_MODELS["gemini-2.0-flash-lite"]).toBe(
      "gemini-3.5-flash-lite"
    );
    await expect(testApiKey("test-api-key")).resolves.toEqual({ valid: true });
    expect(getGenerativeModel).toHaveBeenCalledWith({
      model: AVAILABLE_MODELS["gemini-2.0-flash-lite"],
    });
  });
});

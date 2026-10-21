import { beforeEach, describe, expect, it } from "vitest";
import { loadUserApiConfig } from "@/lib/stores/apiKeyStore";

describe("apiKeyStore", () => {
  beforeEach(() => localStorage.clear());

  it("keeps legacy API keys that do not have createdAt metadata", () => {
    localStorage.setItem(
      "pypractice_api_config_v1",
      JSON.stringify({ provider: "gemini", apiKey: "legacy-test-key" })
    );

    expect(loadUserApiConfig()).toMatchObject({
      provider: "gemini",
      apiKey: "legacy-test-key",
    });
  });
});

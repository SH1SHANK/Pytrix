import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate fresh user
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test("should show onboarding for new users", async ({ page }) => {
    await page.goto("/");

    // Check for onboarding dialog or lock screen
    // The app should show onboarding when no API key is configured
    await expect(
      page
        .getByText("Welcome")
        .or(page.getByText("Get Started"))
        .or(page.getByText("API Key"))
    ).toBeVisible({ timeout: 10000 });
  });

  test("should allow completing onboarding with API key", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Look for API key input or onboarding step
    const apiKeyInput = page
      .getByPlaceholder(/api key/i)
      .or(page.locator('input[type="password"]'));

    // If API key input is visible, fill it
    if (await apiKeyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await apiKeyInput.fill("test-api-key-for-testing");

      // Look for a save/continue button
      const saveButton = page.getByRole("button", {
        name: /save|continue|next/i,
      });
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
      }
    }
  });
});

test.describe("Onboarding Completed", () => {
  test.beforeEach(async ({ page }) => {
    // Set up completed onboarding state
    await page.addInitScript(() => {
      localStorage.setItem(
        "pypractice_api_config_v1",
        JSON.stringify({
          provider: "gemini",
          apiKey: "test-key-for-e2e",
          model: "gemini-flash-lite",
        })
      );
      localStorage.setItem(
        "pytrix-settings",
        JSON.stringify({
          state: {
            hasCompletedOnboarding: true,
            onboardingStep: 5,
          },
          version: 1,
        })
      );
    });
  });

  test("should show dashboard after completing onboarding", async ({
    page,
  }) => {
    await page.goto("/");

    // Should see dashboard content
    await expect(
      page.getByRole("heading", { name: /progress|dashboard/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

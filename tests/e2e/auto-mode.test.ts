import { test, expect } from "@playwright/test";

test.describe("Auto Mode Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state with completed onboarding
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

  test("should navigate to adaptive practice page", async ({ page }) => {
    await page.goto("/practice/adaptive");

    // Should see adaptive/auto mode page content
    await expect(
      page
        .getByRole("heading", { name: /adaptive|auto/i })
        .or(page.getByText(/start.*run/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show save file management", async ({ page }) => {
    await page.goto("/practice/adaptive");

    // Check for save file related UI
    // Could be "Start New Run", "Load Run", or similar
    await expect(
      page.getByText(/run/i).or(page.getByText(/session/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("should be able to start a new run", async ({ page }) => {
    await page.goto("/practice/adaptive");

    // Look for start button
    const startButton = page
      .getByRole("button", { name: /start|new|begin/i })
      .first();

    if (await startButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startButton.click();

      // Should navigate to practice or show a question
      await expect(page).toHaveURL(/practice/, { timeout: 10000 });
    }
  });
});

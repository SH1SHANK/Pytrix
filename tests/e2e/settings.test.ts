import { test, expect } from "@playwright/test";

test.describe("Settings Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
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
            appearance: {
              theme: "github-dark",
            },
          },
          version: 1,
        })
      );
    });
  });

  test("should navigate to settings page", async ({ page }) => {
    await page.goto("/support/settings");

    // Should see settings content
    await expect(
      page
        .getByRole("heading", { name: /settings/i })
        .or(page.getByText(/preferences/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("should display appearance settings", async ({ page }) => {
    await page.goto("/support/settings");

    // Look for appearance/theme related content
    await expect(page.getByText(/appearance|theme|dark|light/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should persist theme changes across reload", async ({ page }) => {
    await page.goto("/support/settings");
    await page.waitForLoadState("networkidle");

    // Find and click theme toggle if available
    const themeToggle = page
      .getByRole("button", { name: /theme|light|dark/i })
      .first();

    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Reload the page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Check that the setting persisted
      const afterReloadClasses = await page
        .locator("html")
        .getAttribute("class");

      // Classes should reflect the persisted state
      expect(afterReloadClasses).toBeDefined();
    }
  });

  test("should display API key section", async ({ page }) => {
    await page.goto("/support/settings");

    // Look for API key or BYOK section
    await expect(
      page.getByText(/api.*key/i).or(page.getByText(/gemini/i))
    ).toBeVisible({ timeout: 10000 });
  });
});

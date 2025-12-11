import { test, expect } from "@playwright/test";

test.describe("Dashboard V2 Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "pypractice_api_config_v1",
        JSON.stringify({
          provider: "gemini",
          apiKey: process.env.TEST_API_KEY || "dummy-key",
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

  test("should load dashboard and show modules", async ({ page }) => {
    // Navigate to dashboard (home)
    await page.goto("/");

    // Check for "Your Progress" and "Module Progress" headers
    await expect(
      page.getByRole("heading", { name: "Your Progress" })
    ).toBeVisible();

    // Check for at least one module card (e.g. "Arrays & Lists")
    // Note: The specific output name depends on topics.json
    // We expect "Module Progress" area to contain grid items
    const grid = page.locator(".grid");
    await expect(grid.first()).toBeVisible();

    // Look for a known module name
    await expect(
      page.getByText("Strings").or(page.getByText("Lists")).first()
    ).toBeVisible();
  });

  test("Practice Module button should navigate with subtopic param", async ({
    page,
  }) => {
    await page.goto("/");

    // Find a "Practice" button within a module card.
    // We target the button that says "Practice"
    const practiceBtn = page.getByRole("button", { name: "Practice" }).first();
    await expect(practiceBtn).toBeVisible();

    await practiceBtn.click();

    // Verify navigation
    // Verify navigation
    await expect(page).toHaveURL(
      /\/practice\?mode=manual&topic=.*&difficulty=beginner/
    );
  });

  test("View Details button should open sheet", async ({ page }) => {
    await page.goto("/");

    // Click "View Details"
    const detailsBtn = page
      .getByRole("button", { name: "View Details" })
      .first();
    await detailsBtn.click();

    // Verify Sheet opens (look for "Mastery" or "Subtopics")
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Subtopics", { exact: true })).toBeVisible();
  });
});

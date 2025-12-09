import { test, expect } from "@playwright/test";

test.describe("Command Center", () => {
  test("should handle initial state and search grouping correctly", async ({
    page,
  }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");

    // Open Command Center
    await page.keyboard.press("Meta+k");
    const dialog = page.getByRole("dialog", { name: "Command Palette" });
    await expect(dialog).toBeVisible();

    // 1. Verify Initial State
    // Should show "Go To" and "Modules"
    await expect(dialog.getByRole("group", { name: "Go To" })).toBeVisible();
    await expect(dialog.getByRole("group", { name: "Modules" })).toBeVisible();

    // Should NOT show "Subtopics" or "Problem Archetypes"
    await expect(dialog.getByRole("group", { name: "Subtopics" })).toBeHidden();
    await expect(
      dialog.getByRole("group", { name: "Problem Archetypes" })
    ).toBeHidden();

    // 2. Perform Search
    const searchInput = page.getByPlaceholder(
      "Type a command or search topic..."
    );
    await searchInput.fill("string");

    // 3. Verify Search State
    // "Go To" might be hidden if no matches, but let's check for curriculum items
    // "Subtopics" and "Problem Archetypes" SHOULD appear if there are matches for "string"
    // Assuming "String Manipulation" module and related subtopics exist
    await expect(dialog.getByRole("group", { name: "Modules" })).toBeVisible(); // Module "String Manipulation" should match
    await expect(
      dialog.getByRole("group", { name: "Subtopics" })
    ).toBeVisible();
    await expect(
      dialog.getByRole("group", { name: "Problem Archetypes" })
    ).toBeVisible();

    // 4. Verify Clearing Search
    await searchInput.fill("");
    await expect(dialog.getByRole("group", { name: "Subtopics" })).toBeHidden();

    // 5. Test Navigation via Archetype
    await searchInput.fill("string");
    // Click on a known archetype if possible, or just the first result in Archetypes group
    const archetypeItem = dialog
      .getByRole("group", { name: "Problem Archetypes" })
      .getByRole("option")
      .first();

    await expect(archetypeItem).toBeVisible();
    await archetypeItem.click();

    // Should navigate to practice page
    await expect(page).toHaveURL(/\/practice\?mode=topic-select/);
    // Verify parameters are present
    const url = new URL(page.url());
    expect(url.searchParams.get("module")).toBeTruthy();
    expect(url.searchParams.get("subtopic")).toBeTruthy();
    expect(url.searchParams.get("problemType")).toBeTruthy();
  });
});

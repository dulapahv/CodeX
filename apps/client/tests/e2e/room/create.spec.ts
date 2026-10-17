/**
 * End-to-end tests for room creation functionality.
 * Tests:
 * - Room creation with valid name
 * - Empty name validation
 * - Form submission
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, test } from "@playwright/test";

import { createRoom } from "@/tests/utils/setup";

test.describe("Room Creation", () => {
  test("should create a new room", async ({ page }) => {
    await createRoom(page, "TestUser");

    // Not a /share/i pattern: that also matches the "Share screen" button
    await expect(page.getByLabel("Share this coding room")).toBeVisible();
  });

  test("should not allow empty name", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Create Room" }).click();

    await expect(page.getByText("Name is required")).toBeVisible();
  });
});

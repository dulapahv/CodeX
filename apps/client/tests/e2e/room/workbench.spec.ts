/**
 * End-to-end tests for the room's VS Code-style layout.
 * Tests:
 * - Running a command from the command palette
 * - Layout shortcuts
 * - Switching side bar views from the activity bar
 * - Renaming the shared file
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, test as it, type Page, test } from "@playwright/test";

import { createRoom, joinRoom } from "@/tests/utils/setup";

const getFileTab = (page: Page, name: string) =>
  page
    .getByRole("region", { name: "Code Editor" })
    .getByRole("tab", { exact: true, name });

test.describe("Workbench", () => {
  it("should run a command from the command palette", async ({ page }) => {
    await createRoom(page, "Palette User");
    const terminal = page.getByRole("region", { name: "Terminal" });
    await expect(terminal).toBeVisible();

    await page.getByRole("button", { name: "Search commands" }).click();
    await page
      .getByPlaceholder("Type the name of a command to run")
      .fill("View: Toggle Panel");
    await page.keyboard.press("Enter");
    await expect(terminal).toBeHidden();

    await page.keyboard.press("Control+J");
    await expect(terminal).toBeVisible();
  });

  it("should switch side bar views from the activity bar", async ({ page }) => {
    await createRoom(page, "Side Bar User");
    const participants = page.getByRole("button", {
      exact: true,
      name: "Participants",
    });
    const heading = page.getByRole("heading", { name: "Participants" });

    await participants.click();
    await expect(heading).toBeVisible();
    await expect(
      page
        .getByRole("list", { name: "1 in this room" })
        .getByText("Side Bar User")
    ).toBeVisible();

    // Clicking the view that's showing hides the side bar, as in VS Code
    await participants.click();
    await expect(heading).toBeHidden();
  });

  it("should share the file name when someone renames it", async ({
    browser,
  }) => {
    const userAPage = await (await browser.newContext()).newPage();
    const userBPage = await (await browser.newContext()).newPage();
    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");
    await expect(getFileTab(userBPage, "main.py")).toBeVisible();

    await getFileTab(userAPage, "main.py").dblclick();
    const fileName = userAPage.getByRole("textbox", { name: "File name" });
    await fileName.fill("solution.js");
    await fileName.press("Enter");

    // The extension picks the language too, for everyone
    await expect(getFileTab(userBPage, "solution.js")).toBeVisible();
    await expect(
      userBPage.getByLabel("Select programming language")
    ).toHaveText("JavaScript");
  });

  it("should share new files while each person keeps their own tabs", async ({
    browser,
  }) => {
    const userAPage = await (await browser.newContext()).newPage();
    const userBPage = await (await browser.newContext()).newPage();
    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    await userAPage
      .getByRole("button", { exact: true, name: "Explorer" })
      .click();
    await userAPage
      .getByRole("button", { exact: true, name: "New File" })
      .click();
    const newFileName = userAPage.getByRole("textbox", {
      name: "New file name",
    });
    await newFileName.fill("utils.py");
    await newFileName.press("Enter");
    await expect(getFileTab(userAPage, "utils.py")).toBeVisible();

    await userBPage
      .getByRole("button", { exact: true, name: "Explorer" })
      .click();
    await expect(
      userBPage.getByRole("list", { name: "Files" }).getByText("utils.py")
    ).toBeVisible();
    await expect(getFileTab(userBPage, "utils.py")).toBeHidden();
  });
});

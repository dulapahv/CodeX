/**
 * End-to-end tests for the room lifecycle.
 * Tests:
 * - Code kept after everyone leaves
 * - Terminating a room
 * - Terminal output for late joiners
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, test } from "@playwright/test";

import { createRoom, joinRoom } from "@/tests/utils/setup";

const EXECUTION_RESULT_PATTERN =
  /Hello from Python!|HTTP error! status:|Process exited with code/;

test.describe("Room Lifecycle", () => {
  test("should keep the room's code after everyone leaves", async ({
    browser,
  }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await userAPage.locator(".view-lines").pressSequentially("kept_code = 1");
    await expect(userAPage.getByText("kept_code = 1")).toBeVisible();

    await userAPage.getByLabel("Leave room", { exact: true }).click();
    await userAPage.getByLabel("Confirm leaving room").click();
    await userAPage.waitForURL("/");

    await joinRoom(userBPage, roomUrl, "User B");
    await expect(userBPage.getByText("kept_code = 1")).toBeVisible();
  });

  test("should send everyone home when the room is terminated", async ({
    browser,
  }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    await userAPage.getByLabel("Leave room", { exact: true }).click();
    await userAPage.getByLabel("Terminate room immediately").click();

    await userBPage.waitForURL("/");
    await expect(
      userBPage.getByText("This room has been terminated.")
    ).toBeVisible();

    // The room no longer exists, so joining it again fails
    const roomId = roomUrl.split("/").pop();
    await userBPage.goto(`/?room=${roomId}`);
    await userBPage.getByPlaceholder("Enter your name").fill("User B");
    await userBPage
      .getByRole("button", { name: "Join Room", exact: true })
      .click();
    await expect(userBPage.getByText("Room does not exist.")).toBeVisible();
  });

  test("should show earlier terminal output to someone who joins later", async ({
    browser,
  }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await userAPage
      .locator(".view-lines")
      .pressSequentially('print("Hello from Python!")');
    await userAPage.getByLabel("Select programming language").click();
    await userAPage
      .getByRole("listbox")
      .getByText("Python", { exact: true })
      .click();
    await userAPage.getByLabel("Run code").click();

    // Piston may fail on CI (no API key) or rate-limit parallel runs; any
    // result is stored in the room's terminal history
    await expect(
      userAPage
        .getByRole("region", { name: "Terminal" })
        .getByText(EXECUTION_RESULT_PATTERN)
        .first()
    ).toBeVisible();

    await joinRoom(userBPage, roomUrl, "User B");
    await expect(
      userBPage
        .getByRole("region", { name: "Terminal" })
        .getByText(EXECUTION_RESULT_PATTERN)
        .first()
    ).toBeVisible();
  });
});

/**
 * End-to-end tests for what the host controls in a room.
 * Tests:
 * - Only the host can terminate the room
 * - A viewer can't change the code or run it
 * - A locked room turns newcomers away until it's unlocked
 * - Someone the host removes can't come back from that browser
 * - The host handing the room to someone else
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, test as it, test } from "@playwright/test";

import { createRoom, joinRoom } from "@/tests/utils/setup";

const VIEW_ONLY = /View only/u;
const LOCKED = /Locked/u;

test.describe("Room Access", () => {
  it("should let only the host terminate the room", async ({ browser }) => {
    const hostPage = await (await browser.newContext()).newPage();
    const guestPage = await (await browser.newContext()).newPage();
    const roomUrl = await createRoom(hostPage, "Host");
    await joinRoom(guestPage, roomUrl, "Guest");

    await guestPage.getByLabel("Leave room", { exact: true }).click();
    await expect(guestPage.getByLabel("Confirm leaving room")).toBeVisible();
    await expect(
      guestPage.getByLabel("Terminate room immediately")
    ).toHaveCount(0);

    await hostPage.getByLabel("Leave room", { exact: true }).click();
    await expect(
      hostPage.getByLabel("Terminate room immediately")
    ).toBeVisible();
  });

  it("should keep a viewer from changing or running the code", async ({
    browser,
  }) => {
    const hostPage = await (await browser.newContext()).newPage();
    const viewerPage = await (await browser.newContext()).newPage();
    const roomUrl = await createRoom(hostPage, "Host");
    await joinRoom(viewerPage, roomUrl, "Viewer");

    await hostPage
      .getByRole("button", { exact: true, name: "Participants" })
      .click();
    await hostPage.getByRole("button", { name: "Manage Viewer" }).click();
    await hostPage.getByRole("menuitem", { name: "Make View Only" }).click();
    await expect(
      viewerPage.getByRole("button", { name: VIEW_ONLY })
    ).toBeVisible();

    // Clicked first, since typing goes wherever the focus is
    await viewerPage.locator(".view-lines").click();
    await viewerPage.keyboard.type("from_viewer = 1");
    await hostPage.locator(".view-lines").click();
    await hostPage.keyboard.type("from_host = 1");

    await expect(viewerPage.getByText("from_host = 1")).toBeVisible();
    await expect(viewerPage.getByText("from_viewer")).toBeHidden();
    await expect(hostPage.getByText("from_viewer")).toBeHidden();
    await expect(
      viewerPage.getByRole("button", { name: "Viewers can't run code" })
    ).toBeDisabled();
  });

  it("should turn newcomers away from a locked room", async ({ browser }) => {
    const hostPage = await (await browser.newContext()).newPage();
    const newcomerPage = await (await browser.newContext()).newPage();
    const roomUrl = await createRoom(hostPage, "Host");
    const roomId = roomUrl.split("/").pop();

    await hostPage
      .getByRole("button", { exact: true, name: "Participants" })
      .click();
    await hostPage.getByRole("button", { name: "Lock Room" }).click();
    await expect(hostPage.getByRole("button", { name: LOCKED })).toBeVisible();

    await newcomerPage.goto(`/?room=${roomId}`);
    await newcomerPage.getByPlaceholder("Enter your name").fill("Newcomer");
    await newcomerPage
      .getByRole("button", { exact: true, name: "Join Room" })
      .click();
    await expect(newcomerPage.getByText("This room is locked.")).toBeVisible();

    await hostPage.getByRole("button", { name: "Unlock Room" }).click();
    await expect(hostPage.getByRole("button", { name: LOCKED })).toBeHidden();
    await joinRoom(newcomerPage, roomUrl, "Newcomer");
  });

  it("should keep someone the host removes out of the room", async ({
    browser,
  }) => {
    const hostPage = await (await browser.newContext()).newPage();
    const guestPage = await (await browser.newContext()).newPage();
    const roomUrl = await createRoom(hostPage, "Host");
    await joinRoom(guestPage, roomUrl, "Guest");

    await hostPage
      .getByRole("button", { exact: true, name: "Participants" })
      .click();
    await hostPage.getByRole("button", { name: "Manage Guest" }).click();
    await hostPage.getByRole("menuitem", { name: "Remove from Room…" }).click();
    await hostPage
      .getByRole("alertdialog")
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(
      guestPage.getByText("The host removed you from this room.")
    ).toBeVisible();

    const roomId = roomUrl.split("/").pop();
    await guestPage.goto(`/?room=${roomId}`);
    await guestPage.getByPlaceholder("Enter your name").fill("Guest");
    await guestPage
      .getByRole("button", { exact: true, name: "Join Room" })
      .click();
    await expect(
      guestPage.getByText("The host removed you from this room.")
    ).toBeVisible();
  });

  it("should let the host hand the room to someone else", async ({
    browser,
  }) => {
    const hostPage = await (await browser.newContext()).newPage();
    const guestPage = await (await browser.newContext()).newPage();
    const roomUrl = await createRoom(hostPage, "Host");
    await joinRoom(guestPage, roomUrl, "Guest");

    await hostPage
      .getByRole("button", { exact: true, name: "Participants" })
      .click();
    await hostPage.getByRole("button", { name: "Manage Guest" }).click();
    await hostPage.getByRole("menuitem", { name: "Make Host…" }).click();
    await hostPage
      .getByRole("alertdialog")
      .getByRole("button", { name: "Make Host" })
      .click();

    await expect(guestPage.getByText("You're now the host")).toBeVisible();
    await guestPage
      .getByRole("button", { exact: true, name: "Participants" })
      .click();
    await expect(
      guestPage.getByRole("button", { name: "Lock Room" })
    ).toBeVisible();
    await expect(
      hostPage.getByRole("button", { name: "Lock Room" })
    ).toHaveCount(0);
  });
});

/**
 * Test utility functions for setting up collaborative editing rooms.
 * Features:
 * - Room creation helper
 * - Room joining helper
 * - Join verification
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, type Page } from "@playwright/test";

const ROOM_URL_PATTERN = /\/room\/.*/;

export async function createRoom(page: Page, name: string) {
  await page.goto("/");

  // Fill name and create room
  await page
    .getByLabel("Create a Room")
    .getByPlaceholder("Enter your name")
    .fill(name);
  await page.getByRole("button", { name: "Create Room" }).click();

  // Wait for room to be created and URL to change /room/:id
  await page.waitForURL(ROOM_URL_PATTERN);

  // Verify room joining
  const hasJoined = await hasJoinedRoom(page);
  if (!hasJoined) {
    throw new Error("Failed to verify room joining after creation");
  }

  return page.url();
}

export async function joinRoom(page: Page, roomUrl: string, name: string) {
  // Navigate directly to the join page to avoid race condition where
  // the socket connects before the /room/:id page can redirect.
  const roomId = roomUrl.split("/").pop();
  await page.goto(`/?room=${roomId}`);

  // Fill name and join room
  await page.getByPlaceholder("Enter your name").fill(name);
  await page.getByRole("button", { name: "Join Room", exact: true }).click();

  // Verify room joining
  const hasJoined = await hasJoinedRoom(page);
  if (!hasJoined) {
    throw new Error("Failed to verify room joining");
  }
}

export async function hasJoinedRoom(page: Page) {
  await expect(page.getByRole("code")).toBeVisible(); // Code editor

  return true;
}

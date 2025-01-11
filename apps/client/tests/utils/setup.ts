/**
 * Test utility functions for setting up collaborative editing rooms.
 * Features:
 * - Room creation helper
 * - Room joining helper
 * - Join verification
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, Page } from '@playwright/test';

export async function createRoom(page: Page, name: string) {
  await page.goto('/');

  // Fill name and create room
  await page
    .getByLabel('Create a Room')
    .getByPlaceholder('Enter your name')
    .fill(name);
  await page.getByRole('button', { name: 'Create Room' }).click();

  // Wait for room to be created and URL to change /room/:id
  await page.waitForURL(/\/room\/.*/);

  // Verify room joining
  const hasJoined = await hasJoinedRoom(page);
  if (!hasJoined) {
    throw new Error('Failed to verify room joining after creation');
  }

  return page.url();
}

export async function joinRoom(page: Page, roomUrl: string, name: string) {
  await page.goto(roomUrl);

  // Wait for the room to be joined and URL to change /?room=:id
  await page.waitForURL(/\/\?room=.*/);

  // Fill name and join room
  await page.getByPlaceholder('Enter your name').fill(name);
  await page.getByRole('button', { name: 'Join Room', exact: true }).click();

  // Verify room joining
  const hasJoined = await hasJoinedRoom(page);
  if (!hasJoined) {
    throw new Error('Failed to verify room joining');
  }
}

export async function hasJoinedRoom(page: Page) {
  await expect(page.getByRole('code')).toBeVisible(); // Code editor

  return true;
}

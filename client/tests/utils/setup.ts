import { expect, Page } from '@playwright/test';

export async function createRoom(page: Page, name: string) {
  await page.goto('/');

  // Fill name and create room
  await page
    .getByLabel('Create a Room')
    .getByPlaceholder('Enter your name')
    .fill(name);
  await page.getByRole('button', { name: 'Create Room' }).click();

  // Wait for successful room creation
  await expect(page.getByLabel('Redirecting')).toBeVisible();

  // Wait for room to be created and URL to change /room/:id
  await page.waitForLoadState('networkidle');

  // Verify room joining
  const hasJoined = await hasJoinedRoom(page, name);
  if (!hasJoined) {
    throw new Error('Failed to verify room joining after creation');
  }

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  return page.url();
}

export async function joinRoom(page: Page, roomUrl: string, name: string) {
  await page.goto(roomUrl);

  // Wait for the room to be joined and URL to change /?room=:id
  await page.waitForLoadState('networkidle');

  // Fill name and join room
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await page.getByRole('button', { name: 'Join Room', exact: true }).click();

  // Verify room joining
  const hasJoined = await hasJoinedRoom(page, name);
  if (!hasJoined) {
    throw new Error('Failed to verify room joining');
  }
}

export async function hasJoinedRoom(page: Page, name: string) {
  await expect(page.getByText('FileEditSelectionViewHelpRun')).toBeVisible(); // Toolbar
  await expect(page.getByRole('code')).toBeVisible(); // Code editor
  await expect(page.getByLabel('Notepad')).toBeVisible(); // Note
  await expect(page.getByLabel('Terminal', { exact: true })).toBeVisible(); // Terminal
  await expect(
    page
      .locator('div')
      .filter({ hasText: `${name} (you)` })
      .nth(1),
  ).toBeVisible(); // Webcam stream

  return true;
}

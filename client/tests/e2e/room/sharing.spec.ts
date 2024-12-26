import { expect, test } from '@playwright/test';

import { createRoom, joinRoom } from '../../utils/setup';

test.describe('Room Sharing', () => {
  test('should handle room sharing functionality', async ({ page }) => {
    // Create a room and wait for navigation to complete
    await createRoom(page, 'TestUser');

    // Click the share button and wait for dialog
    const shareButton = page.getByLabel('Share this coding room');
    await shareButton.click();

    // Wait for the dialog to be visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Get the current URL and extract room ID
    const roomUrl = page.url();
    if (!roomUrl) throw new Error('Room URL not found');
    const roomId = roomUrl.split('/').pop();

    // Wait for input fields to be populated
    const roomIdInput = page.getByRole('textbox', {
      name: 'Room ID for sharing',
    });
    const roomLinkInput = page.getByRole('textbox', {
      name: 'Shareable room link',
    });

    // Use locator.evaluate() to get input values
    const actualRoomId = await roomIdInput.evaluate(
      (el: HTMLInputElement) => el.value,
    );
    const actualRoomUrl = await roomLinkInput.evaluate(
      (el: HTMLInputElement) => el.value,
    );

    // Assert the values
    expect(actualRoomId).toBe(roomId);
    expect(actualRoomUrl).toBe(roomUrl);

    // Test copy functionality
    const copyRoomIdButton = page.getByRole('button', { name: 'Copy room ID' });
    const copyLinkButton = page.getByRole('button', { name: 'Copy room link' });

    await copyRoomIdButton.click();
    await copyLinkButton.click();

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('should allow multiple users to join same room', async ({ browser }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, 'User A');
    await joinRoom(userBPage, roomUrl, 'User B');

    await expect(userAPage.getByText('User A')).toBeVisible();
    await expect(userAPage.getByText('User B')).toBeVisible();
    await expect(userBPage.getByText('User A')).toBeVisible();
    await expect(userBPage.getByText('User B')).toBeVisible();
  });
});

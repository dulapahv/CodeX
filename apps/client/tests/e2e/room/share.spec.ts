/**
 * End-to-end tests for room sharing functionality.
 * Tests:
 * - Share dialog display
 * - Room ID verification
 * - Invite link generation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, test } from '@playwright/test';

import { createRoom, joinRoom } from '@/tests/utils/setup';

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
    if (!roomId) throw new Error('Room ID not found in URL');

    // Wait for input fields to be populated
    const actualRoomId = page.getByTestId('room-id-text');
    const actualRoomUrl = page.getByTestId('invite-link-text');

    // Assert the values
    await expect(actualRoomId).toHaveText(roomId);
    await expect(actualRoomUrl).toHaveText(roomUrl);

    // Test copy functionality
    const copyRoomIdButton = page.getByTestId('room-id-copy-button');
    const copyLinkButton = page.getByTestId('invite-link-copy-button');

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

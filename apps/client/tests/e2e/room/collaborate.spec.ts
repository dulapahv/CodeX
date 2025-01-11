/**
 * End-to-end tests for real-time collaborative features.
 * Tests:
 * - Code sync between users
 * - Multi-user editing
 * - Content verification
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, test } from '@playwright/test';

import { createRoom, joinRoom } from '@/tests/utils/setup';

test.describe('Collaborative Features', () => {
  test('should sync code changes between users in real-time', async ({
    browser,
  }) => {
    // Create two browser contexts for different users
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    // Create pages for both users
    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    // User A creates room, User B joins
    const roomUrl = await createRoom(userAPage, 'User A');
    await joinRoom(userBPage, roomUrl, 'User B');

    // Get editor elements for both users
    const userAEditor = userAPage.locator('.view-lines');
    const userBEditor = userBPage.locator('.view-lines');

    const TEST_CODE1 = 'console.log("Hello World");';
    const TEST_CODE2 = 'console.log("Collaborative editing works!");';
    const EXPECTED_CODE = `${TEST_CODE1}${TEST_CODE2}`;

    // User A types code
    await userAEditor.pressSequentially(TEST_CODE1);

    // Verify code appears in User B's editor
    await expect(userBPage.getByText(TEST_CODE1)).toBeVisible();

    // User B adds code
    await userBPage.keyboard.press('Enter');
    await userBEditor.pressSequentially(TEST_CODE2);

    // Verify both lines appear in both editors
    await expect(userAPage.getByText(EXPECTED_CODE)).toBeVisible();
    await expect(userBPage.getByText(EXPECTED_CODE)).toBeVisible();
  });

  test('should execute code and show output in shared terminal', async ({
    browser,
  }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, 'User A');
    await joinRoom(userBPage, roomUrl, 'User B');

    // Get editor and set Python code
    const editor = userAPage.locator('.view-lines');
    await editor.pressSequentially('print("Hello from Python!")');

    // Set language to Python
    await userAPage.getByLabel('Select programming language').click();
    await userAPage.getByText('Python', { exact: true }).click();

    // Execute code
    await userAPage.getByLabel('Run code').click();

    // Verify output appears in both users' terminals
    const terminal = 'Hello from Python!';
    const outputSelector = 'div.flex-1 > div.whitespace-pre-wrap.break-all';

    await expect(
      userAPage.locator(outputSelector).filter({ hasText: terminal }),
    ).toBeVisible();

    await expect(
      userBPage.locator(outputSelector).filter({ hasText: terminal }),
    ).toBeVisible();
  });

  test('should sync notepad edits between users', async ({ browser }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, 'User A');
    await joinRoom(userBPage, roomUrl, 'User B');

    // Get notepad elements
    const userANotepad = userAPage.getByLabel('editable markdown');
    const userBNotepad = userBPage.getByLabel('editable markdown');

    // User A types note
    await userANotepad.pressSequentially(
      '# Collaborative Notes\nThis is a shared note.',
    );

    // Verify note appears in User B's notepad
    await expect(userBPage.getByText('Collaborative Notes')).toBeVisible();
    await expect(userBPage.getByText('This is a shared note.')).toBeVisible();

    // User B adds more text
    // Go to end of note
    await userBNotepad.press('Control+a');
    await userBNotepad.press('ArrowRight');
    await userBNotepad.pressSequentially('Adding more collaborative content!');

    // Verify complete note appears in both notepads
    // Switch to source mode for both users
    await userAPage.getByLabel('Source mode').click({ force: true });
    await userBPage.getByLabel('Source mode').click({ force: true });

    // Wait for CodeMirror editor to be visible
    const codeMirrorSelector = '.cm-content';
    await userAPage.waitForSelector(codeMirrorSelector);
    await userBPage.waitForSelector(codeMirrorSelector);

    // Verify content in CodeMirror editor for both users
    await expect(
      userAPage
        .locator('.cm-line')
        .filter({ hasText: '# Collaborative Notes' }),
    ).toBeVisible();
    await expect(
      userAPage
        .locator('.cm-line')
        .filter({ hasText: 'This is a shared note.' }),
    ).toBeVisible();
    await expect(
      userAPage
        .locator('.cm-line')
        .filter({ hasText: 'Adding more collaborative content!' }),
    ).toBeVisible();

    await expect(
      userBPage
        .locator('.cm-line')
        .filter({ hasText: '# Collaborative Notes' }),
    ).toBeVisible();
    await expect(
      userBPage
        .locator('.cm-line')
        .filter({ hasText: 'This is a shared note.' }),
    ).toBeVisible();
    await expect(
      userBPage
        .locator('.cm-line')
        .filter({ hasText: 'Adding more collaborative content!' }),
    ).toBeVisible();
  });
});

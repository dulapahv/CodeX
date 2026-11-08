/**
 * End-to-end tests for real-time collaborative features.
 * Tests:
 * - Code sync between users
 * - Multi-user editing
 * - Content verification
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { expect, test as it, test } from "@playwright/test";

import { createRoom, joinRoom } from "@/tests/utils/setup";

const EXECUTION_RESULT_PATTERN =
  /Hello from Python!|HTTP error! status:|Process exited with code/u;
const NOTE_HEADING_PATTERN = /^# Collaborative Notes$/mu;
const NOTE_BODY_PATTERN =
  /^This is a shared note\.Adding more collaborative content!$/mu;

test.describe("Collaborative Features", () => {
  it("should sync code changes between users in real-time", async ({
    browser,
  }) => {
    // Create two browser contexts for different users
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    // Create pages for both users
    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    // User A creates room, User B joins
    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    // Get editor elements for both users
    const userAEditor = userAPage.locator(".view-lines");
    const userBEditor = userBPage.locator(".view-lines");

    const TEST_CODE1 = 'console.log("Hello World");';
    const TEST_CODE2 = 'console.log("Collaborative editing works!");';
    const EXPECTED_CODE = `${TEST_CODE1}${TEST_CODE2}`;

    // User A types code
    await userAEditor.pressSequentially(TEST_CODE1);

    // Verify code appears in User B's editor
    await expect(userBPage.getByText(TEST_CODE1)).toBeVisible();

    // User B adds code
    await userBPage.keyboard.press("Enter");
    await userBEditor.pressSequentially(TEST_CODE2);

    // Verify both lines appear in both editors
    await expect(userAPage.getByText(EXPECTED_CODE)).toBeVisible();
    await expect(userBPage.getByText(EXPECTED_CODE)).toBeVisible();
  });

  it("should execute code and show output in shared terminal", async ({
    browser,
  }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    // Get editor and set Python code
    const editor = userAPage.locator(".view-lines");
    await editor.pressSequentially('print("Hello from Python!")');

    // Set language to Python
    await userAPage.getByLabel("Select programming language").click();
    await userAPage
      .getByRole("listbox")
      .getByText("Python", { exact: true })
      .click();

    // Execute code
    await userAPage.getByLabel("Run code").click();

    // Verify execution result appears in both users' terminals.
    // The Piston API may return 401 on CI (no API key) or 429 when tests run
    // code in parallel, so we check for either successful output or an error
    // response, both prove the execution flow and terminal sync work correctly.
    const userATerminal = userAPage.getByRole("region", { name: "Terminal" });
    const userBTerminal = userBPage.getByRole("region", { name: "Terminal" });

    await expect(
      userATerminal.getByText(EXECUTION_RESULT_PATTERN).first()
    ).toBeVisible();
    await expect(
      userBTerminal.getByText(EXECUTION_RESULT_PATTERN).first()
    ).toBeVisible();
  });

  it("should sync notepad edits between users", async ({ browser }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    const userANotepad = userAPage.getByRole("textbox", {
      name: "Shared note",
    });
    const userBNotepad = userBPage.getByRole("textbox", {
      name: "Shared note",
    });

    // User A types a heading through the markdown shortcut, then a paragraph
    await userANotepad.click();
    await userANotepad.pressSequentially(
      "# Collaborative Notes\nThis is a shared note."
    );

    await expect(
      userBNotepad.getByRole("heading", { name: "Collaborative Notes" })
    ).toBeVisible();
    await expect(
      userBNotepad.getByText("This is a shared note.")
    ).toBeVisible();

    // User B adds to the end of the note
    await userBNotepad.click();
    await userBNotepad.press("Control+a");
    await userBNotepad.press("ArrowRight");
    await userBNotepad.pressSequentially("Adding more collaborative content!");

    // User A sees User B's caret
    await expect(
      userAPage.locator(".notepad-cursor-name", { hasText: "User B" })
    ).toBeAttached();

    // Both see the same markdown in source mode
    await userAPage.getByRole("button", { name: "Source mode" }).click();
    await userBPage.getByRole("button", { name: "Source mode" }).click();
    const userASource = userAPage.getByRole("textbox", {
      name: "Markdown source",
    });
    const userBSource = userBPage.getByRole("textbox", {
      name: "Markdown source",
    });
    await expect(userASource).toHaveValue(NOTE_HEADING_PATTERN);
    await expect(userASource).toHaveValue(NOTE_BODY_PATTERN);
    await expect(userBSource).toHaveValue(NOTE_HEADING_PATTERN);
    await expect(userBSource).toHaveValue(NOTE_BODY_PATTERN);
  });

  it("undo should revert the local user's text after a peer inserts ahead of it", async ({
    browser,
  }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    const userAEditor = userAPage.locator(".view-lines");
    const userBEditor = userBPage.locator(".view-lines");
    const userALine = userAPage.locator(".view-line").first();

    await userAEditor.pressSequentially("AAAA");
    await expect(userBPage.getByText("AAAA")).toBeVisible();

    // User B inserts ahead of User A's text, shifting it right. A native
    // Monaco undo entry still points at the original range [0,4], which now
    // covers User B's characters instead of User A's.
    await userBPage.keyboard.press("Control+Home");
    await userBEditor.pressSequentially("BBBB");
    await expect(userALine).toHaveText("BBBBAAAA");

    // User A undoes their own insertion. "BBBB" must survive.
    await userAPage.keyboard.press("Control+z");

    await expect(userALine).toHaveText("BBBB");
  });
});

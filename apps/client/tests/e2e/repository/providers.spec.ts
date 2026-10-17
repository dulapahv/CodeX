/**
 * End-to-end tests for opening from and saving to git providers. Next's test
 * proxy answers the server's provider API calls, so the real routes and
 * adapters run against canned responses.
 * Tests:
 * - Browse and open a file, per provider
 * - Save a new file and update an existing one, per provider
 * - Token refresh, and the connect prompt when refresh fails
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  type BrowserContext,
  expect,
  type NextFixture,
  type Page,
  test,
} from "next/experimental/testmode/playwright";

import { PROVIDER_IDS, type ProviderId } from "@/lib/git-providers/types";
import { createRoom } from "@/tests/utils/setup";

import { createMockProvider, type MockProvider } from "./mock-providers";

const DAY_MS = 24 * 60 * 60 * 1000;
const OPEN_ITEM = /Open from repository/;
const SAVE_ITEM = /Save to repository/;
const SIGN_IN_SUCCESS = /\/oauth\/gitlab\?status=success/;

interface SessionCookie {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
}

const connect = (
  context: BrowserContext,
  provider: ProviderId,
  session: SessionCookie = { accessToken: "test-token" }
) =>
  context.addCookies([
    {
      name: `git_${provider}`,
      value: encodeURIComponent(
        JSON.stringify({ ...session, sessionExpiresAt: Date.now() + DAY_MS })
      ),
      domain: "localhost",
      path: `/api/${provider}`,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

const openFileMenuItem = async (
  page: Page,
  isMobile: boolean,
  item: RegExp
) => {
  if (isMobile) {
    await page.getByRole("menuitem", { name: "Open menu" }).tap();
    await page.getByRole("menuitem", { name: "File" }).tap();
    await page.getByRole("menuitem", { name: item }).tap();
  } else {
    await page.getByRole("menuitem", { name: "File", exact: true }).click();
    await page.getByRole("menuitem", { name: item }).click();
  }
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
};

const browseTo = async (
  dialog: ReturnType<Page["getByRole"]>,
  mock: MockProvider,
  names: string[]
) => {
  await dialog.getByRole("tab", { name: mock.label }).click();
  for (const name of names) {
    await dialog.getByText(name, { exact: true }).click();
  }
};

const useMock = (next: NextFixture, mock: MockProvider) => {
  next.onFetch(async (request) => (await mock.handle(request)) ?? "continue");
};

for (const provider of PROVIDER_IDS) {
  test.describe(`Repository: ${provider}`, () => {
    test("opens a file from the repository", async ({
      page,
      context,
      next,
      isMobile,
    }) => {
      const mock = createMockProvider(provider);
      useMock(next, mock);
      await connect(context, provider);
      await createRoom(page, "Tester");

      const dialog = await openFileMenuItem(page, isMobile, OPEN_ITEM);
      await browseTo(dialog, mock, ["demo", "main", "src", "app.py"]);
      await dialog.getByRole("button", { name: "Open", exact: true }).click();

      await expect(dialog).not.toBeVisible();
      await expect(
        page.locator(".monaco-editor .view-lines").first()
      ).toContainText(`hello from ${mock.label}`);
    });

    test("saves a new file and updates an existing one", async ({
      page,
      context,
      next,
      isMobile,
    }) => {
      const mock = createMockProvider(provider);
      useMock(next, mock);
      await connect(context, provider);
      await createRoom(page, "Tester");

      const dialog = await openFileMenuItem(page, isMobile, SAVE_ITEM);
      await browseTo(dialog, mock, ["demo", "main", "src"]);
      await dialog.getByPlaceholder("Filename (e.g., hello.js)").fill("new.py");
      await dialog.getByPlaceholder("Commit summary").fill("Add new file");
      await dialog.getByRole("button", { name: "Save", exact: true }).click();

      const savedLink = dialog.getByRole("link", {
        name: `Saved · View on ${mock.label}`,
      });
      await expect(savedLink).toBeVisible();
      expect(mock.commits).toHaveLength(1);
      expect(mock.isCreate(mock.commits[0])).toBe(true);

      await dialog.getByText("app.py", { exact: true }).click();
      await expect(
        dialog.getByPlaceholder("Filename (e.g., hello.js)")
      ).toHaveValue("app.py");
      await dialog.getByRole("button", { name: "Save", exact: true }).click();

      await expect.poll(() => mock.commits.length).toBe(2);
      expect(mock.isUpdate(mock.commits[1])).toBe(true);
    });
  });
}

test.describe("Repository: token refresh", () => {
  test("refreshes an expired token without asking to connect", async ({
    page,
    context,
    next,
    isMobile,
  }) => {
    const mock = createMockProvider("gitlab");
    mock.refresh = { accessToken: "fresh-token", succeeds: true };
    useMock(next, mock);
    await connect(context, "gitlab", {
      accessToken: "expired-token",
      expiresAt: Date.now() - 1000,
      refreshToken: "old-refresh-token",
    });
    await createRoom(page, "Tester");

    const dialog = await openFileMenuItem(page, isMobile, OPEN_ITEM);
    await dialog.getByRole("tab", { name: "GitLab" }).click();
    await expect(dialog.getByText("demo", { exact: true })).toBeVisible();

    const cookies = await context.cookies("http://localhost:3000/api/gitlab");
    const session = cookies.find((cookie) => cookie.name === "git_gitlab");
    expect(decodeURIComponent(session?.value ?? "")).toContain(
      "rotated-refresh-token"
    );
  });

  // Bitbucket's tokens alone are larger than the 4 KB a browser keeps in one
  // cookie
  test("keeps a sign-in whose tokens don't fit in one cookie", async ({
    page,
    context,
    next,
    isMobile,
  }) => {
    const mock = createMockProvider("gitlab");
    mock.refresh = { accessToken: "a".repeat(5000), succeeds: true };
    useMock(next, mock);

    // The provider sending the user back after they approve the sign-in
    await context.addCookies([
      {
        name: "oauth_state",
        value: "test-state",
        domain: "localhost",
        path: "/api/gitlab/auth",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/api/gitlab/auth?code=test-code&state=test-state");
    await expect(page).toHaveURL(SIGN_IN_SUCCESS);

    await createRoom(page, "Tester");

    const dialog = await openFileMenuItem(page, isMobile, OPEN_ITEM);
    await browseTo(dialog, mock, ["demo", "main", "src", "app.py"]);
    await dialog.getByRole("button", { name: "Open", exact: true }).click();

    await expect(
      page.locator(".monaco-editor .view-lines").first()
    ).toContainText(`hello from ${mock.label}`);
  });

  test("shows the connect prompt when the refresh fails", async ({
    page,
    context,
    next,
    isMobile,
  }) => {
    const mock = createMockProvider("gitlab");
    mock.refresh = { accessToken: "fresh-token", succeeds: false };
    useMock(next, mock);
    await connect(context, "gitlab", {
      accessToken: "expired-token",
      expiresAt: Date.now() - 1000,
      refreshToken: "revoked-refresh-token",
    });
    await createRoom(page, "Tester");

    const dialog = await openFileMenuItem(page, isMobile, OPEN_ITEM);
    await dialog.getByRole("tab", { name: "GitLab" }).click();
    await expect(
      dialog.getByRole("button", { name: "Connect to GitLab" })
    ).toBeVisible();
  });
});

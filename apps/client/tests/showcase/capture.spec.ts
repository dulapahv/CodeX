/**
 * Captures the homepage showcase images from a live room with six people.
 * Run it with the test servers, as the repository shot needs the fake
 * provider from tests/e2e/repository.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import {
  type BrowserContext,
  expect,
  type Page,
  test,
} from "next/experimental/testmode/playwright";

import { createRoom, joinRoom } from "@/tests/utils/setup";

const SHOWCASE = path.resolve(process.cwd(), "../../docs/showcase");
const OUTPUT = path.resolve(process.cwd(), "public/images/showcase");
const VIEWPORT = { height: 900, width: 1440 };
const PREVIEW_VIEWPORT = { height: 1440, width: 2560 };
const PREVIEWER = "Sam";
const CALL_VIEWPORT = { height: 440, width: 1440 };
// Short enough that the repository list scrolls under the save fields
const DIALOG_VIEWPORT = { height: 640, width: 1440 };
const SCALE = 2;
const ASPECT = 9 / 16;
const PEOPLE = ["Mia", "Priya", "Alex", "Yuki", "Sam"];
const SAVE_ITEM = /Save to repository/u;
const FILENAME_FIELD = /Filename/u;
const COMMIT_FIELD = /Commit summary/u;

const PLANNER = `// Plans focus blocks in the gaps of someone's calendar
export function planFocusBlocks(calendar, options = {}) {
  const { minMinutes = 45, maxMinutes = 120 } = options;
  const blocks = [];

  for (const gap of findGaps(calendar)) {
    const minutes = Math.min(gap.minutes, maxMinutes);
    if (minutes < minMinutes) {
      continue;
    }
    blocks.push({
      start: gap.start,
      minutes,
      label: labelFor(gap.start),
      quiet: gap.minutes >= 90,
    });
  }

  return blocks;
}

function findGaps(calendar) {
  const events = [...calendar].sort((a, b) => a.start - b.start);
  return events.slice(1).map((event, index) => ({
    start: events[index].end,
    minutes: (event.start - events[index].end) / 60_000,
  }));
}

function labelFor(start) {
  const hour = new Date(start).getHours();
  if (hour < 12) return "Morning deep work";
  return hour < 17 ? "Afternoon focus" : "Evening wrap-up";
}
`;

const BUGGY_SUMMARY = `sessions = {"Mon": 210, "Tue": 252, "Wed": 168, "Thu": 306, "Fri": 234}
print(f"Focus this week: {totl // 60}h")
`;

const SUMMARY = `sessions = {"Mon": 210, "Tue": 252, "Wed": 168, "Thu": 306, "Fri": 234}
total = sum(sessions.values())
best = max(sessions, key=sessions.get)

print(f"Focus this week: {total // 60}h {total % 60}m")
print(f"Best day: {best} with {sessions[best]} minutes\\n")
for day, minutes in sessions.items():
    print(f"{day}  {'█' * (minutes // 20):<16} {minutes}m")
`;

// Selections each person holds in the planner, as [line, column] pairs
const SELECTIONS: Record<string, [number, number, number, number]> = {
  Alex: [11, 5, 11, 16],
  Mia: [4, 9, 4, 15],
  Priya: [2, 17, 2, 32],
  Sam: [12, 19, 12, 19],
  Yuki: [8, 9, 8, 29],
};

const TREE: Record<string, { name: string; type: "dir" | "file" }[]> = {
  "": [
    { name: "public", type: "dir" },
    { name: "src", type: "dir" },
    { name: "index.html", type: "file" },
    { name: "package.json", type: "file" },
    { name: "README.md", type: "file" },
  ],
  public: [{ name: "og-image.png", type: "file" }],
  src: [
    { name: "chart.js", type: "file" },
    { name: "focus-planner.js", type: "file" },
    { name: "waitlist.js", type: "file" },
  ],
};

const REPOS = ["landing", "api", "design-tokens"];
const GITHUB_API = "https://api.github.com";
const CONTENTS_PREFIX = "/repos/lumen-app/landing/contents/";

const githubResponse = (request: Request) => {
  const url = new URL(request.url);
  if (url.origin !== GITHUB_API) {
    return;
  }
  if (url.pathname === "/user") {
    return Response.json({ avatar_url: null, login: "lumen-app" });
  }
  if (url.pathname === "/user/repos") {
    return Response.json(
      REPOS.map((name, index) => ({
        full_name: `lumen-app/${name}`,
        id: index + 1,
        name,
      }))
    );
  }
  if (url.pathname.endsWith("/branches")) {
    return Response.json([{ name: "main" }, { name: "launch-week" }]);
  }
  if (url.pathname.startsWith(CONTENTS_PREFIX)) {
    const folder = decodeURIComponent(
      url.pathname.slice(CONTENTS_PREFIX.length)
    );
    const entries = TREE[folder];
    if (entries) {
      return Response.json(
        entries.map((entry) => ({
          ...entry,
          path: folder ? `${folder}/${entry.name}` : entry.name,
        }))
      );
    }
  }
  return Response.json({ message: "Not Found" }, { status: 404 });
};

const connectGithub = (context: BrowserContext) =>
  context.addCookies([
    {
      domain: "localhost",
      httpOnly: true,
      name: "git_github",
      path: "/api/github",
      sameSite: "Lax",
      value: encodeURIComponent(
        JSON.stringify({
          accessToken: "showcase-token",
          sessionExpiresAt: Date.now() + 86_400_000,
        })
      ),
    },
  ]);

const capture = async (
  page: Page,
  name: string,
  box: { height?: number; width: number; x: number; y: number }
) => {
  const clip = {
    height: box.height ?? Math.round(box.width * ASPECT),
    width: Math.round(box.width),
    x: Math.round(box.x),
    y: Math.round(box.y),
  };
  await page.screenshot({ clip, path: path.join(OUTPUT, `${name}.png`) });
};

const boxOf = async (page: Page, selector: string) => {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) {
    throw new Error(`${selector} isn't on the page`);
  }
  return box;
};

type Handle = "call" | "notepad" | "preview" | "terminal";

// Side by side handles run left to right, and the terminal's lies flat
const VERTICAL_HANDLES: Handle[] = ["notepad", "preview", "call"];

const dragHandle = async (
  page: Page,
  handle: Handle,
  dx: number,
  dy: number
) => {
  const boxes = (
    await Promise.all(
      (
        await page.locator('[data-slot="resizable-handle"]').all()
      ).map((element) => element.boundingBox())
    )
  ).filter((found) => found !== null);
  const vertical = boxes
    .filter((found) => found.height > found.width)
    .sort((a, b) => a.x - b.x);
  const box =
    handle === "terminal"
      ? boxes.find((candidate) => candidate.width > candidate.height)
      : vertical[VERTICAL_HANDLES.indexOf(handle)];
  if (!box) {
    throw new Error(`The ${handle} resize handle isn't on the page`);
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 12 });
  await page.mouse.up();
};

const setCode = (page: Page, code: string, language: string) =>
  page.evaluate(
    ([value, languageId]) => {
      const { monaco } = window as unknown as {
        monaco: typeof import("monaco-editor");
      };
      const [editor] = monaco.editor.getEditors();
      editor.setValue(value);
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, languageId);
      }
    },
    [code, language]
  );

const setLanguage = (page: Page, language: string) =>
  page.evaluate((languageId) => {
    const { monaco } = window as unknown as {
      monaco: typeof import("monaco-editor");
    };
    const model = monaco.editor.getEditors()[0]?.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, languageId);
    }
  }, language);

const select = (page: Page, range: [number, number, number, number]) =>
  page.evaluate(([startLine, startColumn, endLine, endColumn]) => {
    const { monaco } = window as unknown as {
      monaco: typeof import("monaco-editor");
    };
    const [editor] = monaco.editor.getEditors();
    editor.focus();
    editor.setSelection(
      new monaco.Selection(startLine, startColumn, endLine, endColumn)
    );
  }, range);

const loadNote = async (page: Page, file: string) => {
  const markdown = readFileSync(path.join(SHOWCASE, file), "utf8");
  await page.getByRole("button", { name: "Source mode" }).click();
  await page.getByRole("textbox", { name: "Markdown source" }).fill(markdown);
  await page.getByRole("button", { name: "Source mode" }).click();
  await expect(page.getByText("Lumen launch week")).toBeVisible();
};

test.use({
  colorScheme: "dark",
  deviceScaleFactor: SCALE,
  viewport: VIEWPORT,
});

test("captures the homepage showcase", async ({
  browser,
  context,
  next,
  page,
}) => {
  test.setTimeout(600_000);
  // Only the fixture's page reaches the fake GitHub, so Kenji uses it
  next.onFetch((request) => githubResponse(request) ?? "continue");
  await connectGithub(context);

  const roomUrl = await createRoom(page, "Kenji");
  const guests: Record<string, Page> = {};
  for (const name of PEOPLE) {
    // Chromium draws the sandboxed Live Preview frame at 1x under emulated
    // scaling, so Sam's large 1x window takes that shot instead
    const isPreviewer = name === PREVIEWER;
    // biome-ignore lint/performance/noAwaitInLoops: people join one at a time like they would for real
    const guestContext = await browser.newContext({
      colorScheme: "dark",
      deviceScaleFactor: isPreviewer ? 1 : SCALE,
      viewport: isPreviewer ? PREVIEW_VIEWPORT : VIEWPORT,
    });
    const guest = await guestContext.newPage();
    await joinRoom(guest, roomUrl, name);
    guests[name] = guest;
  }
  await expect(page.getByText("Sam", { exact: true })).toBeVisible();

  // Everyone working in the same file, with names on their cursors
  await setCode(page, PLANNER, "javascript");
  await page.evaluate(() => {
    const { monaco } = window as unknown as {
      monaco: typeof import("monaco-editor");
    };
    monaco.editor.getEditors()[0]?.updateOptions({ fontSize: 14 });
  });
  await page.addStyleTag({
    content: '[class^="cursor-"]::after { animation: none !important; }',
  });
  for (const [name, range] of Object.entries(SELECTIONS)) {
    // biome-ignore lint/performance/noAwaitInLoops: each person moves their own cursor
    await setLanguage(guests[name], "javascript");
    await select(guests[name], range);
  }
  await select(page, [6, 40, 6, 40]);
  await page.waitForTimeout(1500);
  const editor = await boxOf(page, '[aria-label="Code Editor"]');
  await capture(page, "collaborate", {
    width: editor.width * 0.6,
    x: editor.x,
    y: editor.y,
  });

  // Live Preview of the launch page beside its code, wide enough for its
  // desktop layout
  const previewer = guests[PREVIEWER];
  await setCode(
    page,
    readFileSync(path.join(SHOWCASE, "lumen-landing.html"), "utf8"),
    "html"
  );
  // Everyone drops their selection so the code beside the preview is clean
  for (const viewer of [page, ...Object.values(guests)]) {
    // biome-ignore lint/performance/noAwaitInLoops: each person moves their own cursor
    await select(viewer, [1, 1, 1, 1]);
  }
  await setLanguage(previewer, "html");
  await dragHandle(previewer, "preview", -300, 0);
  await previewer.waitForTimeout(5000);
  const preview = await boxOf(previewer, "iframe");
  await capture(previewer, "live-preview", {
    width: preview.width + 360,
    x: preview.x - 360,
    y: preview.y,
  });

  // Two runs in the shared terminal, one by Priya that fails, one by Kenji
  await dragHandle(page, "terminal", 0, -200);
  await setCode(page, BUGGY_SUMMARY, "python");
  await setLanguage(guests.Priya, "python");
  await guests.Priya.getByLabel("Run code").click();
  await expect(page.getByText("· Priya")).toBeVisible({ timeout: 30_000 });
  await setCode(page, SUMMARY, "python");
  await setLanguage(guests.Mia, "python");
  await guests.Mia.getByLabel("Run code").click();
  await expect(page.getByText("· Mia")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  const terminal = await boxOf(page, '[aria-label="Terminal"]');
  const terminalHeight = Math.min(terminal.height, 400);
  await capture(page, "terminal", {
    height: terminalHeight,
    width: terminalHeight / ASPECT,
    x: terminal.x,
    y: terminal.y,
  });

  // The notepad with the launch notes, widened to show its toolbar
  await loadNote(page, "lumen-cover-note.md");
  await dragHandle(page, "notepad", 420, 0);
  await page.waitForTimeout(1000);
  const notepad = await boxOf(page, '[aria-label="Notepad"]');
  await capture(page, "notepad", {
    width: notepad.width,
    x: notepad.x,
    y: notepad.y,
  });

  // Everyone in the call, in a short window so the controls sit under them
  await page.setViewportSize(CALL_VIEWPORT);
  await dragHandle(page, "call", -460, 0);
  await page.waitForTimeout(1500);
  const call = await boxOf(page, '[aria-label="Webcam Stream"]');
  await capture(page, "video", {
    width: call.width,
    x: call.x,
    y: call.y,
  });
  await page.setViewportSize(VIEWPORT);

  // Saving to a repository
  await page.setViewportSize(DIALOG_VIEWPORT);
  await page.getByRole("menuitem", { exact: true, name: "File" }).click();
  await page.getByRole("menuitem", { name: SAVE_ITEM }).click();
  const dialog = page.getByRole("dialog");
  for (const item of ["landing", "main", "src"]) {
    // biome-ignore lint/performance/noAwaitInLoops: each click opens the next level of the tree
    await dialog.getByText(item, { exact: true }).click();
  }
  const file = dialog.getByText("focus-planner.js", { exact: true });
  await file.click();
  await dialog.getByPlaceholder(FILENAME_FIELD).fill("focus-planner.js");
  await dialog
    .getByPlaceholder(COMMIT_FIELD)
    .fill("feat: plan focus blocks around calendar gaps");
  // Scrolls the tree so the chosen file sits near the bottom of what shows
  await file.evaluate((element) => {
    const scrolls = (node: HTMLElement) =>
      ["auto", "scroll"].includes(getComputedStyle(node).overflowY) &&
      node.scrollHeight > node.clientHeight;
    let scroller = element.parentElement;
    while (scroller && !scrolls(scroller)) {
      scroller = scroller.parentElement;
    }
    if (scroller) {
      const row = element.getBoundingClientRect();
      const area = scroller.getBoundingClientRect();
      scroller.scrollTop += row.bottom - area.bottom + row.height * 3;
    }
  });
  await page.waitForTimeout(500);
  const box = await boxOf(page, '[role="dialog"]');
  const height = Math.round(box.width * ASPECT);
  await capture(page, "github", {
    width: box.width,
    x: box.x,
    y: box.y + box.height - height,
  });
});

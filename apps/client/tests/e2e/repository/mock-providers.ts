/**
 * Fake provider APIs for the repository e2e tests. Each mock answers the
 * server-side requests an adapter makes for one small repository
 * (octo/demo, branch main, src/app.py) and records the commits it receives.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ProviderId } from "@/lib/git-providers/types";

interface TreeEntry {
  name: string;
  type: "dir" | "file";
}

const TREE: Record<string, TreeEntry[]> = {
  "": [
    { name: "src", type: "dir" },
    { name: "README.md", type: "file" },
  ],
  src: [{ name: "app.py", type: "file" }],
};

const FILES = new Set(["README.md", "src/app.py"]);
const COMMIT_HASH = "abc123";
const NOT_FOUND = 404;
const CREATED = 201;
const TRAILING_SLASH = /\/$/u;

const entriesAt = (path: string) =>
  (TREE[path] ?? []).map((entry) => ({
    ...entry,
    path: path ? `${path}/${entry.name}` : entry.name,
  }));

const json = (body: unknown, status = 200) => Response.json(body, { status });
const notFound = () => json({ message: "Not Found" }, NOT_FOUND);

export interface RecordedCommit {
  body: string;
  method: string;
  url: string;
}

export interface MockProvider {
  commits: RecordedCommit[];
  fileContent: string;
  handle: (request: Request) => Promise<Response | undefined>;
  id: ProviderId;
  isCreate: (commit: RecordedCommit) => boolean;
  isUpdate: (commit: RecordedCommit) => boolean;
  label: string;
  // Set before a test to control the OAuth refresh outcome
  refresh: { accessToken: string; succeeds: boolean };
}

type Router = (
  url: URL,
  request: Request,
  mock: MockProvider
) => Promise<Response | undefined>;

const record = async (mock: MockProvider, request: Request) => {
  mock.commits.push({
    body: await request.text(),
    method: request.method,
    url: request.url,
  });
};

const refreshResponse = (mock: MockProvider) =>
  mock.refresh.succeeds
    ? json({
        access_token: mock.refresh.accessToken,
        expires_in: 7200,
        refresh_token: "rotated-refresh-token",
      })
    : json({ error: "invalid_grant" }, 400);

const githubRouter: Router = async (url, request, mock) => {
  if (url.host !== "api.github.com") {
    return;
  }
  const path = url.pathname;
  if (path === "/user") {
    return json({ avatar_url: null, login: "octo" });
  }
  if (path === "/user/repos") {
    return json([{ full_name: "octo/demo", id: 1, name: "demo" }]);
  }
  if (path === "/repos/octo/demo/branches") {
    return json([{ name: "main" }]);
  }
  const prefix = "/repos/octo/demo/contents/";
  if (!path.startsWith(prefix)) {
    return notFound();
  }
  const filePath = decodeURIComponent(path.slice(prefix.length));
  if (request.method === "PUT") {
    await record(mock, request);
    return json({
      content: {
        html_url: `https://github.com/octo/demo/blob/main/${filePath}`,
      },
    });
  }
  if (TREE[filePath]) {
    return json(entriesAt(filePath));
  }
  if (!FILES.has(filePath)) {
    return notFound();
  }
  return request.headers.get("accept")?.includes("raw")
    ? new Response(mock.fileContent)
    : json({ name: filePath, path: filePath, sha: "sha-1", type: "file" });
};

const gitlabRouter: Router = async (url, request, mock) => {
  if (url.host !== "gitlab.com") {
    return;
  }
  const path = url.pathname;
  if (path === "/oauth/token") {
    return refreshResponse(mock);
  }
  // Every API call must carry the token the session currently holds
  if (
    request.headers.get("authorization") !==
    `Bearer ${mock.refresh.accessToken}`
  ) {
    return json({ message: "401 Unauthorized" }, 401);
  }
  if (path === "/api/v4/user") {
    return json({ avatar_url: null, username: "octo" });
  }
  if (path === "/api/v4/projects") {
    return json([{ id: 1, name: "demo", path_with_namespace: "octo/demo" }]);
  }
  const project = "/api/v4/projects/octo%2Fdemo/repository";
  if (path === `${project}/branches`) {
    return json([{ name: "main" }]);
  }
  if (path === `${project}/tree`) {
    const folder = url.searchParams.get("path") ?? "";
    return json(
      entriesAt(folder).map((entry) => ({
        ...entry,
        type: entry.type === "dir" ? "tree" : "blob",
      }))
    );
  }
  const filePrefix = `${project}/files/`;
  if (!path.startsWith(filePrefix)) {
    return notFound();
  }
  const rest = path.slice(filePrefix.length);
  if (rest.endsWith("/raw")) {
    return new Response(mock.fileContent);
  }
  const filePath = decodeURIComponent(rest);
  if (request.method === "HEAD") {
    return FILES.has(filePath) ? new Response(null) : notFound();
  }
  await record(mock, request);
  return json({ branch: "main", file_path: filePath }, CREATED);
};

const bitbucketRouter: Router = async (url, request, mock) => {
  if (
    url.host === "bitbucket.org" &&
    url.pathname === "/site/oauth2/access_token"
  ) {
    return refreshResponse(mock);
  }
  if (url.host !== "api.bitbucket.org") {
    return;
  }
  const path = url.pathname;
  if (path === "/2.0/user") {
    return json({ display_name: "Octo", links: {}, nickname: "octo" });
  }
  if (path === "/2.0/repositories") {
    return json({
      values: [{ full_name: "octo/demo", name: "demo", uuid: "{1}" }],
    });
  }
  const repo = "/2.0/repositories/octo/demo";
  if (path === `${repo}/refs/branches`) {
    return json({ values: [{ name: "main" }] });
  }
  if (path === `${repo}/refs/branches/main`) {
    return json({ target: { hash: COMMIT_HASH } });
  }
  if (path === `${repo}/src` && request.method === "POST") {
    await record(mock, request);
    return new Response(null, { status: CREATED });
  }
  const srcPrefix = `${repo}/src/${COMMIT_HASH}/`;
  if (!path.startsWith(srcPrefix)) {
    return notFound();
  }
  const target = decodeURIComponent(path.slice(srcPrefix.length));
  const folder = target.replace(TRAILING_SLASH, "");
  if (TREE[folder] && (target === "" || target.endsWith("/"))) {
    return json({
      values: entriesAt(folder).map((entry) => ({
        path: entry.path,
        type: entry.type === "dir" ? "commit_directory" : "commit_file",
      })),
    });
  }
  return FILES.has(target) ? new Response(mock.fileContent) : notFound();
};

const codebergRouter: Router = async (url, request, mock) => {
  if (url.host !== "codeberg.org") {
    return;
  }
  const path = url.pathname;
  if (path === "/login/oauth/access_token") {
    return refreshResponse(mock);
  }
  if (path === "/api/v1/user") {
    return json({ avatar_url: null, login: "octo" });
  }
  if (path === "/api/v1/user/repos") {
    return json(
      url.searchParams.get("page") === "1"
        ? [
            {
              full_name: "octo/demo",
              id: 1,
              name: "demo",
              updated_at: "2026-10-01T00:00:00Z",
            },
          ]
        : []
    );
  }
  const repo = "/api/v1/repos/octo/demo";
  if (path === `${repo}/branches`) {
    return json([{ name: "main" }]);
  }
  if (path.startsWith(`${repo}/raw/`)) {
    return new Response(mock.fileContent);
  }
  if (path === `${repo}/contents`) {
    return json(entriesAt(""));
  }
  const prefix = `${repo}/contents/`;
  if (!path.startsWith(prefix)) {
    return notFound();
  }
  const filePath = decodeURIComponent(path.slice(prefix.length));
  if (request.method === "POST" || request.method === "PUT") {
    await record(mock, request);
    return json(
      {
        content: {
          html_url: `https://codeberg.org/octo/demo/src/branch/main/${filePath}`,
        },
      },
      CREATED
    );
  }
  if (TREE[filePath]) {
    return json(entriesAt(filePath));
  }
  return FILES.has(filePath)
    ? json({ name: filePath, path: filePath, sha: "sha-1", type: "file" })
    : notFound();
};

const ROUTERS: Record<ProviderId, Router> = {
  bitbucket: bitbucketRouter,
  codeberg: codebergRouter,
  github: githubRouter,
  gitlab: gitlabRouter,
};

const LABELS: Record<ProviderId, string> = {
  bitbucket: "Bitbucket",
  codeberg: "Codeberg",
  github: "GitHub",
  gitlab: "GitLab",
};

// How each provider's API distinguishes creating a file from updating one
const CREATE_CHECKS: Record<ProviderId, (commit: RecordedCommit) => boolean> = {
  bitbucket: (commit) => commit.body.includes("src/new.py"),
  codeberg: (commit) => commit.method === "POST",
  github: (commit) => commit.method === "PUT" && !commit.body.includes('"sha"'),
  gitlab: (commit) => commit.method === "POST",
};

const UPDATE_CHECKS: Record<ProviderId, (commit: RecordedCommit) => boolean> = {
  bitbucket: (commit) => commit.body.includes("src/app.py"),
  codeberg: (commit) =>
    commit.method === "PUT" && commit.body.includes('"sha"'),
  github: (commit) => commit.method === "PUT" && commit.body.includes('"sha"'),
  gitlab: (commit) => commit.method === "PUT",
};

export const createMockProvider = (id: ProviderId): MockProvider => {
  const mock: MockProvider = {
    commits: [],
    fileContent: `print("hello from ${LABELS[id]}")`,
    handle: async (request) =>
      await ROUTERS[id](new URL(request.url), request, mock),
    id,
    isCreate: CREATE_CHECKS[id],
    isUpdate: UPDATE_CHECKS[id],
    label: LABELS[id],
    refresh: { accessToken: "test-token", succeeds: true },
  };
  return mock;
};

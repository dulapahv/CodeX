/**
 * GitHub adapter. OAuth app tokens never expire, so there is no refresh.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  GITHUB_API_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_OAUTH_URL,
  GITHUB_USER_AGENT,
} from "@/lib/constants";

import {
  encodePath,
  ProviderError,
  requestToken,
  send,
  sendIfExists,
  sendJson,
  toBase64,
} from "./http";
import type { GitProvider } from "./provider";
import type { GitEntry, GitRepo } from "./types";

const LABEL = "GitHub";

interface GithubRepo {
  full_name: string;
  id: number;
  name: string;
}

interface GithubContent {
  name: string;
  path: string;
  sha: string;
  type: string;
}

const headers = (token: string, accept = "application/vnd.github+json") => ({
  Accept: accept,
  Authorization: `Bearer ${token}`,
  "User-Agent": GITHUB_USER_AGENT,
  "X-GitHub-Api-Version": "2022-11-28",
});

const contentsUrl = (repo: string, path: string, ref?: string) => {
  const url = `${GITHUB_API_URL}/repos/${encodePath(repo)}/contents/${encodePath(path)}`;
  return ref ? `${url}?ref=${encodeURIComponent(ref)}` : url;
};

const toRepo = (repo: GithubRepo): GitRepo => ({
  fullName: repo.full_name,
  id: String(repo.id),
  name: repo.name,
});

export const github: GitProvider = {
  // The callback comes from the OAuth app's settings, so redirect_uri is omitted
  authorizeUrl: (state) =>
    `${GITHUB_OAUTH_URL}/authorize?${new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: "repo",
      state,
    })}`,

  commitFile: async (token, { repo, branch, path, content, message }) => {
    const current = await sendIfExists(
      contentsUrl(repo, path, branch),
      { headers: headers(token) },
      LABEL
    );
    const sha = current
      ? ((await current.json()) as GithubContent).sha
      : undefined;

    const result = await sendJson<{ content: { html_url: string } }>(
      contentsUrl(repo, path),
      {
        body: JSON.stringify({
          branch,
          content: toBase64(content),
          message,
          ...(sha && { sha }),
        }),
        headers: { ...headers(token), "Content-Type": "application/json" },
        method: "PUT",
      },
      LABEL
    );
    return { url: result.content.html_url };
  },

  exchangeCode: (code) =>
    requestToken(
      `${GITHUB_OAUTH_URL}/access_token`,
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET ?? "",
        code,
      },
      LABEL
    ),

  getUser: async (token) => {
    const user = await sendJson<{ avatar_url: string; login: string }>(
      `${GITHUB_API_URL}/user`,
      { headers: headers(token) },
      LABEL
    );
    return { avatarUrl: user.avatar_url, username: user.login };
  },
  id: "github",

  isConfigured: () => Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
  label: LABEL,

  listBranches: async (token, repo) => {
    const branches = await sendJson<{ name: string }[]>(
      `${GITHUB_API_URL}/repos/${encodePath(repo)}/branches?per_page=100`,
      { headers: headers(token) },
      LABEL
    );
    return branches.map(({ name }) => ({ name }));
  },

  listDirectory: async (token, repo, ref, path) => {
    const contents = await sendJson<GithubContent[] | GithubContent>(
      contentsUrl(repo, path, ref),
      { headers: headers(token) },
      LABEL
    );
    if (!Array.isArray(contents)) {
      throw new ProviderError(400, "That path is a file, not a folder.");
    }
    return contents
      .filter((entry) => entry.type === "dir" || entry.type === "file")
      .map(
        (entry): GitEntry => ({
          name: entry.name,
          path: entry.path,
          type: entry.type === "dir" ? "dir" : "file",
        })
      );
  },

  listRepos: async (token, query) => {
    if (query) {
      const data = await sendJson<{ items: GithubRepo[] }>(
        `${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(query)}+in:name+user:@me&sort=updated&order=desc&per_page=100`,
        { headers: headers(token) },
        LABEL
      );
      return data.items.map(toRepo);
    }
    const repos = await sendJson<GithubRepo[]>(
      `${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`,
      { headers: headers(token) },
      LABEL
    );
    return repos.map(toRepo);
  },

  readFile: async (token, repo, ref, path) => {
    const response = await send(
      contentsUrl(repo, path, ref),
      { headers: headers(token, "application/vnd.github.v3.raw") },
      LABEL
    );
    return response.text();
  },

  refresh: () => {
    throw new ProviderError(401, "Connect to GitHub again.");
  },
};

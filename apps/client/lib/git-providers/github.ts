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
  Authorization: `Bearer ${token}`,
  "User-Agent": GITHUB_USER_AGENT,
  Accept: accept,
  "X-GitHub-Api-Version": "2022-11-28",
});

const contentsUrl = (repo: string, path: string, ref?: string) => {
  const url = `${GITHUB_API_URL}/repos/${encodePath(repo)}/contents/${encodePath(path)}`;
  return ref ? `${url}?ref=${encodeURIComponent(ref)}` : url;
};

const toRepo = (repo: GithubRepo): GitRepo => ({
  id: String(repo.id),
  name: repo.name,
  fullName: repo.full_name,
});

export const github: GitProvider = {
  id: "github",
  label: LABEL,

  isConfigured: () => Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),

  // The callback comes from the OAuth app's settings, so redirect_uri is omitted
  authorizeUrl: (state) =>
    `${GITHUB_OAUTH_URL}/authorize?${new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: "repo",
      state,
    })}`,

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

  refresh: () => {
    throw new ProviderError(401, "Connect to GitHub again.");
  },

  getUser: async (token) => {
    const user = await sendJson<{ avatar_url: string; login: string }>(
      `${GITHUB_API_URL}/user`,
      { headers: headers(token) },
      LABEL
    );
    return { username: user.login, avatarUrl: user.avatar_url };
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

  readFile: async (token, repo, ref, path) => {
    const response = await send(
      contentsUrl(repo, path, ref),
      { headers: headers(token, "application/vnd.github.v3.raw") },
      LABEL
    );
    return response.text();
  },

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
        method: "PUT",
        headers: { ...headers(token), "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          content: toBase64(content),
          branch,
          ...(sha && { sha }),
        }),
      },
      LABEL
    );
    return { url: result.content.html_url };
  },
};

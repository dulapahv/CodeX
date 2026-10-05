/**
 * Codeberg (Forgejo) adapter. Its API mirrors GitHub's contents API. Forgejo
 * has no OAuth scopes, so these tokens carry full account rights and must
 * never leave the server.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  CODEBERG_CLIENT_ID,
  CODEBERG_CLIENT_SECRET,
  CODEBERG_URL,
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
import type { GitEntry } from "./types";

const LABEL = "Codeberg";
const API_URL = `${CODEBERG_URL}/api/v1`;
const REPO_PAGE_SIZE = 50;
const REPO_PAGES = [1, 2] as const;

interface CodebergRepo {
  full_name: string;
  id: number;
  name: string;
  updated_at: string;
}

interface CodebergContent {
  html_url: string;
  name: string;
  path: string;
  sha: string;
  type: string;
}

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

const repoUrl = (repo: string) => `${API_URL}/repos/${encodePath(repo)}`;

const contentsUrl = (repo: string, path: string, ref?: string) => {
  const url = path
    ? `${repoUrl(repo)}/contents/${encodePath(path)}`
    : `${repoUrl(repo)}/contents`;
  return ref ? `${url}?ref=${encodeURIComponent(ref)}` : url;
};

const tokenParams = () => ({
  client_id: CODEBERG_CLIENT_ID,
  client_secret: CODEBERG_CLIENT_SECRET ?? "",
});

export const codeberg: GitProvider = {
  id: "codeberg",
  label: LABEL,

  isConfigured: () => Boolean(CODEBERG_CLIENT_ID && CODEBERG_CLIENT_SECRET),

  authorizeUrl: (state, redirectUri) =>
    `${CODEBERG_URL}/login/oauth/authorize?${new URLSearchParams({
      client_id: CODEBERG_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
    })}`,

  exchangeCode: (code, redirectUri) =>
    requestToken(
      `${CODEBERG_URL}/login/oauth/access_token`,
      {
        ...tokenParams(),
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      },
      LABEL
    ),

  refresh: (refreshToken) =>
    requestToken(
      `${CODEBERG_URL}/login/oauth/access_token`,
      {
        ...tokenParams(),
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      },
      LABEL
    ),

  getUser: async (token) => {
    const user = await sendJson<{ avatar_url: string; login: string }>(
      `${API_URL}/user`,
      { headers: headers(token) },
      LABEL
    );
    return { username: user.login, avatarUrl: user.avatar_url };
  },

  // The search API doesn't cover repos shared with the user, so filter here
  listRepos: async (token, query) => {
    const pages = await Promise.all(
      REPO_PAGES.map((page) =>
        sendJson<CodebergRepo[]>(
          `${API_URL}/user/repos?limit=${REPO_PAGE_SIZE}&page=${page}`,
          { headers: headers(token) },
          LABEL
        )
      )
    );
    const needle = query?.toLowerCase();
    return pages
      .flat()
      .filter((repo) => !needle || repo.name.toLowerCase().includes(needle))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((repo) => ({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
      }));
  },

  listBranches: async (token, repo) => {
    const branches = await sendJson<{ name: string }[]>(
      `${repoUrl(repo)}/branches?limit=50`,
      { headers: headers(token) },
      LABEL
    );
    return branches.map(({ name }) => ({ name }));
  },

  listDirectory: async (token, repo, ref, path) => {
    const contents = await sendJson<CodebergContent[] | CodebergContent>(
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
      `${repoUrl(repo)}/raw/${encodePath(path)}?ref=${encodeURIComponent(ref)}`,
      { headers: headers(token) },
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
      ? ((await current.json()) as CodebergContent).sha
      : undefined;

    const result = await sendJson<{ content: { html_url: string } }>(
      contentsUrl(repo, path),
      {
        method: sha ? "PUT" : "POST",
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

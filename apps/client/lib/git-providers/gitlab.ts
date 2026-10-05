/**
 * GitLab adapter for gitlab.com. Projects are addressed by their URL-encoded
 * path, and access tokens expire after two hours with rotating refresh tokens.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  GITLAB_CLIENT_ID,
  GITLAB_CLIENT_SECRET,
  GITLAB_URL,
} from "@/lib/constants";

import { encodePath, requestToken, send, sendIfExists, sendJson } from "./http";
import type { GitProvider } from "./provider";

const LABEL = "GitLab";
const API_URL = `${GITLAB_URL}/api/v4`;

interface GitlabProject {
  id: number;
  name: string;
  path_with_namespace: string;
}

interface GitlabTreeEntry {
  name: string;
  path: string;
  type: "tree" | "blob" | "commit";
}

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

const projectUrl = (repo: string) =>
  `${API_URL}/projects/${encodeURIComponent(repo)}`;

const fileUrl = (repo: string, path: string) =>
  `${projectUrl(repo)}/repository/files/${encodeURIComponent(path)}`;

const tokenParams = () => ({
  client_id: GITLAB_CLIENT_ID,
  client_secret: GITLAB_CLIENT_SECRET ?? "",
});

export const gitlab: GitProvider = {
  id: "gitlab",
  label: LABEL,

  isConfigured: () => Boolean(GITLAB_CLIENT_ID && GITLAB_CLIENT_SECRET),

  // Writing files through the REST API needs the full `api` scope
  authorizeUrl: (state, redirectUri) =>
    `${GITLAB_URL}/oauth/authorize?${new URLSearchParams({
      client_id: GITLAB_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "api",
      state,
    })}`,

  exchangeCode: (code, redirectUri) =>
    requestToken(
      `${GITLAB_URL}/oauth/token`,
      {
        ...tokenParams(),
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      },
      LABEL
    ),

  refresh: (refreshToken, redirectUri) =>
    requestToken(
      `${GITLAB_URL}/oauth/token`,
      {
        ...tokenParams(),
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        redirect_uri: redirectUri,
      },
      LABEL
    ),

  getUser: async (token) => {
    const user = await sendJson<{
      avatar_url: string | null;
      username: string;
    }>(`${API_URL}/user`, { headers: headers(token) }, LABEL);
    return { username: user.username, avatarUrl: user.avatar_url };
  },

  listRepos: async (token, query) => {
    const params = new URLSearchParams({
      membership: "true",
      order_by: "last_activity_at",
      per_page: "100",
      simple: "true",
    });
    if (query) {
      params.set("search", query);
    }
    const projects = await sendJson<GitlabProject[]>(
      `${API_URL}/projects?${params}`,
      { headers: headers(token) },
      LABEL
    );
    return projects.map((project) => ({
      id: String(project.id),
      name: project.name,
      fullName: project.path_with_namespace,
    }));
  },

  listBranches: async (token, repo) => {
    const branches = await sendJson<{ name: string }[]>(
      `${projectUrl(repo)}/repository/branches?per_page=100`,
      { headers: headers(token) },
      LABEL
    );
    return branches.map(({ name }) => ({ name }));
  },

  listDirectory: async (token, repo, ref, path) => {
    const params = new URLSearchParams({ ref, per_page: "100" });
    if (path) {
      params.set("path", path);
    }
    const entries = await sendJson<GitlabTreeEntry[]>(
      `${projectUrl(repo)}/repository/tree?${params}`,
      { headers: headers(token) },
      LABEL
    );
    return entries
      .filter((entry) => entry.type !== "commit")
      .map((entry) => ({
        name: entry.name,
        path: entry.path,
        type: entry.type === "tree" ? "dir" : "file",
      }));
  },

  readFile: async (token, repo, ref, path) => {
    const response = await send(
      `${fileUrl(repo, path)}/raw?ref=${encodeURIComponent(ref)}`,
      { headers: headers(token) },
      LABEL
    );
    return response.text();
  },

  commitFile: async (token, { repo, branch, path, content, message }) => {
    const current = await sendIfExists(
      `${fileUrl(repo, path)}?ref=${encodeURIComponent(branch)}`,
      { method: "HEAD", headers: headers(token) },
      LABEL
    );

    await send(
      fileUrl(repo, path),
      {
        method: current ? "PUT" : "POST",
        headers: { ...headers(token), "Content-Type": "application/json" },
        body: JSON.stringify({ branch, content, commit_message: message }),
      },
      LABEL
    );

    return {
      url: `${GITLAB_URL}/${repo}/-/blob/${encodePath(branch)}/${encodePath(path)}`,
    };
  },
};

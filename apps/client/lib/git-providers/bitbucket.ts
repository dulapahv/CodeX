/**
 * Bitbucket Cloud adapter. Tokens are sent only as a Bearer header, expire
 * after two hours, and refresh tokens rotate on every use.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  BITBUCKET_API_URL,
  BITBUCKET_CLIENT_ID,
  BITBUCKET_CLIENT_SECRET,
  BITBUCKET_URL,
} from "@/lib/constants";

import { encodePath, requestToken, send, sendJson } from "./http";
import type { GitProvider } from "./provider";

const LABEL = "Bitbucket";

interface Paginated<T> {
  values: T[];
}

interface BitbucketRepo {
  full_name: string;
  name: string;
  uuid: string;
}

interface BitbucketSrcEntry {
  path: string;
  type: "commit_directory" | "commit_file";
}

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

const repoUrl = (repo: string) =>
  `${BITBUCKET_API_URL}/repositories/${encodePath(repo)}`;

const basicAuth = () => ({
  id: BITBUCKET_CLIENT_ID,
  secret: BITBUCKET_CLIENT_SECRET ?? "",
});

// `src` takes a commit, and branch names containing "/" would be ambiguous there
const resolveCommit = async (token: string, repo: string, ref: string) => {
  const branch = await sendJson<{ target: { hash: string } }>(
    `${repoUrl(repo)}/refs/branches/${encodeURIComponent(ref)}`,
    { headers: headers(token) },
    LABEL
  );
  return branch.target.hash;
};

const srcUrl = (repo: string, commit: string, path: string) =>
  `${repoUrl(repo)}/src/${commit}/${encodePath(path)}`;

export const bitbucket: GitProvider = {
  id: "bitbucket",
  label: LABEL,

  isConfigured: () => Boolean(BITBUCKET_CLIENT_ID && BITBUCKET_CLIENT_SECRET),

  // Scopes and the callback URL are set on the OAuth client itself
  authorizeUrl: (state) =>
    `${BITBUCKET_URL}/site/oauth2/authorize?${new URLSearchParams({
      client_id: BITBUCKET_CLIENT_ID,
      response_type: "code",
      state,
    })}`,

  exchangeCode: (code) =>
    requestToken(
      `${BITBUCKET_URL}/site/oauth2/access_token`,
      { grant_type: "authorization_code", code },
      LABEL,
      basicAuth()
    ),

  refresh: (refreshToken) =>
    requestToken(
      `${BITBUCKET_URL}/site/oauth2/access_token`,
      { grant_type: "refresh_token", refresh_token: refreshToken },
      LABEL,
      basicAuth()
    ),

  getUser: async (token) => {
    const user = await sendJson<{
      display_name: string;
      links: { avatar?: { href: string } };
      nickname?: string;
    }>(`${BITBUCKET_API_URL}/user`, { headers: headers(token) }, LABEL);
    return {
      username: user.nickname ?? user.display_name,
      avatarUrl: user.links.avatar?.href ?? null,
    };
  },

  listRepos: async (token, query) => {
    const params = new URLSearchParams({
      role: "member",
      sort: "-updated_on",
      pagelen: "100",
    });
    if (query) {
      params.set("q", `name ~ "${query.replaceAll('"', '\\"')}"`);
    }
    const data = await sendJson<Paginated<BitbucketRepo>>(
      `${BITBUCKET_API_URL}/repositories?${params}`,
      { headers: headers(token) },
      LABEL
    );
    return data.values.map((repo) => ({
      id: repo.uuid,
      name: repo.name,
      fullName: repo.full_name,
    }));
  },

  listBranches: async (token, repo) => {
    const data = await sendJson<Paginated<{ name: string }>>(
      `${repoUrl(repo)}/refs/branches?pagelen=100&sort=-target.date`,
      { headers: headers(token) },
      LABEL
    );
    return data.values.map(({ name }) => ({ name }));
  },

  listDirectory: async (token, repo, ref, path) => {
    const commit = await resolveCommit(token, repo, ref);
    const folder = path
      ? `${srcUrl(repo, commit, path)}/`
      : srcUrl(repo, commit, "");
    const data = await sendJson<Paginated<BitbucketSrcEntry>>(
      `${folder}?pagelen=100`,
      { headers: headers(token) },
      LABEL
    );
    return data.values.map((entry) => ({
      name: entry.path.split("/").at(-1) ?? entry.path,
      path: entry.path,
      type: entry.type === "commit_directory" ? "dir" : "file",
    }));
  },

  readFile: async (token, repo, ref, path) => {
    const commit = await resolveCommit(token, repo, ref);
    const response = await send(
      srcUrl(repo, commit, path),
      { headers: headers(token) },
      LABEL
    );
    return response.text();
  },

  commitFile: async (token, { repo, branch, path, content, message }) => {
    const form = new FormData();
    form.set(path, content);
    form.set("message", message);
    form.set("branch", branch);

    await send(
      `${repoUrl(repo)}/src`,
      { method: "POST", headers: headers(token), body: form },
      LABEL
    );

    return {
      url: `${BITBUCKET_URL}/${encodePath(repo)}/src/${encodeURIComponent(branch)}/${encodePath(path)}`,
    };
  },
};

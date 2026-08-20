/**
 * GitHub authentication utility functions.
 * Features:
 * - Cookie management
 * - OAuth token handling
 * - User data types
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  GITHUB_API_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_OAUTH_URL,
  GITHUB_USER_AGENT,
  IS_DEV_ENV,
} from "@/lib/constants";

interface GithubUser {
  avatar_url: string;
  login: string;
}

const ACCESS_TOKEN = "access_token" as const;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// Centralized cookie management
export const authCookie = {
  set: async (token: string, isDev: boolean = IS_DEV_ENV) => {
    const cookieStore = await cookies();
    const options = {
      secure: !isDev,
      httpOnly: true,
      sameSite: isDev ? ("lax" as const) : ("strict" as const),
      expires: new Date(Date.now() + SEVEN_DAYS),
    };

    cookieStore.set(ACCESS_TOKEN, token, options);
  },
  get: async (): Promise<RequestCookie | undefined> => {
    const cookieStore = await cookies();
    return cookieStore.get("access_token");
  },
  delete: async () => {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
  },
};

// Shared authentication check
export const verifyGithubAuth = async () => {
  const token = await authCookie.get();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
        "User-Agent": GITHUB_USER_AGENT,
      },
    });

    if (!response.ok) {
      return null;
    }

    const userData: GithubUser = await response.json();
    return {
      username: userData.login,
      avatarUrl: userData.avatar_url,
    };
  } catch {
    return null;
  }
};

// Input validation for SSRF prevention.
//
// Every call site interpolates these values into the GitHub API URL after
// running each path segment through encodeURIComponent, which escapes all
// URL-structural characters (/ ? # : @ & = % and control bytes). Encoding does
// not neutralize a literal ".." segment or a leading "/", so those are checked
// explicitly below. Beyond that we only reject what git itself forbids, since a
// character allowlist rejects legal paths such as "app/(home)/page.tsx".
const GITHUB_OWNER_REPO_RE = /^[a-zA-Z0-9._-]+$/;

// git check-ref-format forbids these in a ref name, alongside control characters.
const REF_ILLEGAL_CHARS = new Set([" ", "~", "^", ":", "?", "*", "[", "\\"]);

const SPACE_CODE_POINT = 0x20;
const DELETE_CODE_POINT = 0x7f;

const MAX_OWNER_REPO_LENGTH = 100;
const MAX_PATH_LENGTH = 500;
const MAX_REF_LENGTH = 255;

// C0 control characters and DEL are never valid in a git path or ref name.
const hasControlCharacter = (value: string): boolean => {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < SPACE_CODE_POINT || code === DELETE_CODE_POINT) {
      return true;
    }
  }
  return false;
};

export const validateGitHubOwner = (value: string): boolean =>
  GITHUB_OWNER_REPO_RE.test(value) && value.length <= MAX_OWNER_REPO_LENGTH;

export const validateGitHubRepo = (value: string): boolean => {
  // repo can be "owner/repo" or just "name"
  const parts = value.split("/");
  return (
    parts.length <= 2 &&
    parts.every(
      (p) => GITHUB_OWNER_REPO_RE.test(p) && p.length <= MAX_OWNER_REPO_LENGTH
    )
  );
};

export const validateGitHubPath = (value: string): boolean => {
  // An empty path addresses the repository root.
  if (value === "") {
    return true;
  }

  if (value.length > MAX_PATH_LENGTH || hasControlCharacter(value)) {
    return false;
  }

  // A leading slash would escape the /repos/{owner}/{repo}/contents/ prefix.
  if (value.startsWith("/")) {
    return false;
  }

  // Reject traversal segments only. A filename such as "notes..md" is legal, so
  // this inspects each segment rather than searching for ".." as a substring.
  return value
    .split("/")
    .every((segment) => segment !== "." && segment !== "..");
};

export const validateGitHubBranch = (value: string): boolean => {
  // A ref may be a branch, a tag, or a commit SHA; all follow check-ref-format.
  if (value === "" || value.length > MAX_REF_LENGTH) {
    return false;
  }

  if (hasControlCharacter(value)) {
    return false;
  }

  for (const char of value) {
    if (REF_ILLEGAL_CHARS.has(char)) {
      return false;
    }
  }

  if (value.includes("..") || value.includes("@{") || value === "@") {
    return false;
  }

  if (
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("//") ||
    value.endsWith(".")
  ) {
    return false;
  }

  return value
    .split("/")
    .every(
      (segment) => !(segment.startsWith(".") || segment.endsWith(".lock"))
    );
};

// API route handlers
export const githubAuthHandlers = {
  // Consolidated check/get endpoint
  async check() {
    const userData = await verifyGithubAuth();
    return userData
      ? NextResponse.json(userData)
      : NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  },

  async callback(code: string) {
    try {
      const response = await fetch(
        `${GITHUB_OAUTH_URL}/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
        }
      );

      const data = await response.json();

      if ("error" in data) {
        return { error: data.error, description: data.error_description };
      }

      await authCookie.set(data.access_token);
      return { success: true };
    } catch (error) {
      return { error: "Authentication failed", description: String(error) };
    }
  },

  async logout() {
    await authCookie.delete();
    return NextResponse.json({ success: true });
  },
};

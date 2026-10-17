/**
 * Per-provider sessions kept in httpOnly cookies scoped to /api/<provider>.
 * Sessions last 30 days from sign-in; expiring access tokens are refreshed on
 * the way through.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { cookies } from "next/headers";

import { IS_DEV_ENV } from "@/lib/constants";

import { ProviderError, type TokenSet } from "./http";
import type { GitProvider } from "./provider";
import type { ProviderId } from "./types";

const SESSION_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;
const STATE_MAX_AGE_SECONDS = 10 * 60;
const MS_PER_SECOND = 1000;
const STATE_COOKIE = "oauth_state";
// Browsers silently drop a cookie over 4 KB, and Bitbucket's tokens alone are
// larger, so a long session is split across numbered cookies
const MAX_CHUNK_LENGTH = 3800;
const MAX_CHUNKS = 20;

interface Session extends TokenSet {
  sessionExpiresAt: number;
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const sessionCookie = (provider: ProviderId) => `git_${provider}`;
const sessionPath = (provider: ProviderId) => `/api/${provider}`;
const statePath = (provider: ProviderId) => `/api/${provider}/auth`;

// The first piece keeps the plain name, so short sessions look as they did
const chunkCookie = (provider: ProviderId, index: number) =>
  index === 0 ? sessionCookie(provider) : `${sessionCookie(provider)}.${index}`;

// Measured after URL-encoding, which is how the value is sent
const splitValue = (value: string): string[] => {
  const chunks: string[] = [];
  let chunk = "";
  let length = 0;
  for (const char of value) {
    const charLength = encodeURIComponent(char).length;
    if (length + charLength > MAX_CHUNK_LENGTH) {
      chunks.push(chunk);
      chunk = "";
      length = 0;
    }
    chunk += char;
    length += charLength;
  }
  chunks.push(chunk);
  return chunks;
};

const readSessionValue = (cookieStore: CookieStore, provider: ProviderId) => {
  let value = "";
  for (let index = 0; index < MAX_CHUNKS; index++) {
    const chunk = cookieStore.get(chunkCookie(provider, index))?.value;
    if (chunk === undefined) {
      break;
    }
    value += chunk;
  }
  return value || undefined;
};

// Removes the numbered pieces from `fromIndex` on, left over from a longer
// session
const deleteChunks = (
  cookieStore: CookieStore,
  provider: ProviderId,
  fromIndex: number
) => {
  for (let index = fromIndex; index < MAX_CHUNKS; index++) {
    const name = chunkCookie(provider, index);
    if (cookieStore.has(name)) {
      cookieStore.delete({ name, path: sessionPath(provider) });
    }
  }
};

const cookieOptions = (path: string, maxAge: number) => ({
  httpOnly: true,
  secure: !IS_DEV_ENV,
  sameSite: "lax" as const,
  path,
  maxAge,
});

const parseSession = (value: string | undefined): Session | null => {
  if (!value) {
    return null;
  }
  try {
    const session = JSON.parse(value) as Session;
    const isValid =
      typeof session.accessToken === "string" &&
      typeof session.sessionExpiresAt === "number" &&
      session.sessionExpiresAt > Date.now();
    return isValid ? session : null;
  } catch {
    return null;
  }
};

export const writeSession = async (
  provider: ProviderId,
  tokens: TokenSet,
  sessionExpiresAt = Date.now() + SESSION_LENGTH_MS
) => {
  const cookieStore = await cookies();
  const session: Session = { ...tokens, sessionExpiresAt };
  const options = cookieOptions(
    sessionPath(provider),
    Math.floor((sessionExpiresAt - Date.now()) / MS_PER_SECOND)
  );
  const chunks = splitValue(JSON.stringify(session));
  for (const [index, chunk] of chunks.entries()) {
    cookieStore.set(chunkCookie(provider, index), chunk, options);
  }
  deleteChunks(cookieStore, provider, chunks.length);
};

export const clearSession = async (provider: ProviderId) => {
  const cookieStore = await cookies();
  deleteChunks(cookieStore, provider, 0);
};

// `refreshWithin` lets the auth route refresh early, before data routes need it
export const getAccessToken = async (
  provider: GitProvider,
  redirectUri: string,
  refreshWithin = 0
): Promise<string> => {
  const cookieStore = await cookies();
  const session = parseSession(readSessionValue(cookieStore, provider.id));
  if (!session) {
    throw new ProviderError(401, `Connect to ${provider.label} first.`);
  }

  const isExpiring =
    session.expiresAt !== undefined &&
    session.expiresAt - refreshWithin <= Date.now();
  if (!isExpiring) {
    return session.accessToken;
  }

  try {
    if (!session.refreshToken) {
      throw new ProviderError(401, "No refresh token");
    }
    const tokens = await provider.refresh(session.refreshToken, redirectUri);
    await writeSession(
      provider.id,
      { ...tokens, refreshToken: tokens.refreshToken ?? session.refreshToken },
      session.sessionExpiresAt
    );
    return tokens.accessToken;
  } catch {
    await clearSession(provider.id);
    throw new ProviderError(
      401,
      `Your ${provider.label} connection has expired. Connect again.`
    );
  }
};

export const createState = async (provider: ProviderId) => {
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(
    STATE_COOKIE,
    state,
    cookieOptions(statePath(provider), STATE_MAX_AGE_SECONDS)
  );
  return state;
};

// Single use: the cookie is cleared whether or not the state matches
export const consumeState = async (
  provider: ProviderId,
  state: string | null
) => {
  const cookieStore = await cookies();
  const expected = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete({ name: STATE_COOKIE, path: statePath(provider) });
  return Boolean(state && expected && state === expected);
};

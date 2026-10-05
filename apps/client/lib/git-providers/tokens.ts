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

interface Session extends TokenSet {
  sessionExpiresAt: number;
}

const sessionCookie = (provider: ProviderId) => `git_${provider}`;
const sessionPath = (provider: ProviderId) => `/api/${provider}`;
const statePath = (provider: ProviderId) => `/api/${provider}/auth`;

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
  cookieStore.set(
    sessionCookie(provider),
    JSON.stringify(session),
    cookieOptions(
      sessionPath(provider),
      Math.floor((sessionExpiresAt - Date.now()) / MS_PER_SECOND)
    )
  );
};

export const clearSession = async (provider: ProviderId) => {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: sessionCookie(provider),
    path: sessionPath(provider),
  });
};

// `refreshWithin` lets the auth route refresh early, before data routes need it
export const getAccessToken = async (
  provider: GitProvider,
  redirectUri: string,
  refreshWithin = 0
): Promise<string> => {
  const cookieStore = await cookies();
  const session = parseSession(
    cookieStore.get(sessionCookie(provider.id))?.value
  );
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

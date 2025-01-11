/**
 * GitHub authentication utility functions.
 * Features:
 * - Cookie management
 * - OAuth token handling
 * - User data types
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  GITHUB_API_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_OAUTH_URL,
  IS_DEV_ENV,
} from '@/lib/constants';

interface GithubUser {
  login: string;
  avatar_url: string;
}

const ACCESS_TOKEN = 'access_token' as const;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// Centralized cookie management
export const authCookie = {
  set: async (token: string, isDev: boolean = IS_DEV_ENV) => {
    const cookieStore = await cookies();
    const options = {
      secure: !isDev,
      httpOnly: true,
      sameSite: isDev ? ('lax' as const) : ('strict' as const),
      expires: new Date(Date.now() + SEVEN_DAYS),
    };

    cookieStore.set(ACCESS_TOKEN, token, options);
  },
  get: async (): Promise<RequestCookie | undefined> => {
    const cookieStore = await cookies();
    return cookieStore.get('access_token');
  },
  delete: async () => {
    const cookieStore = await cookies();
    cookieStore.delete('access_token');
  },
};

// Shared authentication check
export const verifyGithubAuth = async () => {
  const token = await authCookie.get();
  if (!token) return null;

  try {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });

    if (!response.ok) return null;

    const userData: GithubUser = await response.json();
    return {
      username: userData.login,
      avatarUrl: userData.avatar_url,
    };
  } catch {
    return null;
  }
};

// API route handlers
export const githubAuthHandlers = {
  // Consolidated check/get endpoint
  async check() {
    const userData = await verifyGithubAuth();
    return userData
      ? NextResponse.json(userData)
      : NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  },

  async callback(code: string) {
    try {
      const response = await fetch(
        `${GITHUB_OAUTH_URL}/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
        },
      );

      const data = await response.json();

      if ('error' in data) {
        return { error: data.error, description: data.error_description };
      }

      await authCookie.set(data.access_token);
      return { success: true };
    } catch (error) {
      return { error: 'Authentication failed', description: String(error) };
    }
  },

  async logout() {
    await authCookie.delete();
    return NextResponse.json({ success: true });
  },
};

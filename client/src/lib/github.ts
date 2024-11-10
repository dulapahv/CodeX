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
}

// Centralized cookie management
export const authCookie = {
  set: (token: string) => {
    cookies().set('access_token', token, {
      secure: !IS_DEV_ENV,
      httpOnly: true,
      sameSite: IS_DEV_ENV ? 'lax' : 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    });
  },
  get: () => cookies().get('access_token'),
  delete: () => cookies().delete('access_token'),
};

// Shared authentication check
export async function verifyGithubAuth() {
  const token = authCookie.get();
  if (!token) return null;

  try {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });

    if (!response.ok) return null;

    const userData: GithubUser = await response.json();
    return userData.login;
  } catch {
    return null;
  }
}

// API route handlers
export const githubAuthHandlers = {
  // Consolidated check/get endpoint
  async check() {
    const username = await verifyGithubAuth();
    return username
      ? NextResponse.json({ username })
      : NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  },

  async callback(code: string) {
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

    authCookie.set(data.access_token);
    return { success: true };
  },

  async logout() {
    authCookie.delete();
    return NextResponse.json({ success: true });
  },
};

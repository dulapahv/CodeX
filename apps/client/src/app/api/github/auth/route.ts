/**
 * GitHub OAuth API route handler.
 * Handles authentication flow with:
 * - OAuth callback processing
 * - Authentication status check
 * - Session cleanup
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { NextRequest } from 'next/server';

import { githubAuthHandlers } from '@/lib/github';

// export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code');

  // OAuth callback
  if (code) {
    const result = await githubAuthHandlers.callback(code);

    // Get the base URL from the request
    const baseUrl = new URL(req.url).origin;

    if (result.success) {
      return Response.redirect(`${baseUrl}/oauth/github?status=success`);
    } else {
      const redirectUrl = new URL(`${baseUrl}/oauth/github`);
      redirectUrl.searchParams.set('status', result.error);
      redirectUrl.searchParams.set('description', result.description);
      return Response.redirect(redirectUrl.toString());
    }
  }

  // Regular auth check
  return githubAuthHandlers.check();
}

export async function DELETE() {
  return githubAuthHandlers.logout();
}

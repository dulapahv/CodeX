/**
 * GitHub authentication route handler. Handles OAuth callbacks and
 * authentication checks.
 * Uses Edge Runtime for optimal performance.
 *
 * @remarks
 * This handler supports two modes:
 * 1. OAuth callback - Processes GitHub OAuth response with authorization code
 * 2. Regular auth check - Verifies current authentication status
 *
 * Uses [`githubAuthHandlers`](src/lib/github.ts) for authentication logic.
 *
 * @example
 * ```ts
 * // OAuth callback
 * GET /api/github/auth?code=abc123
 *
 * // Auth check
 * GET /api/github/auth
 *
 * // Logout
 * DELETE /api/github/auth
 * ```
 *
 * @param req - Next.js Edge API request object
 * @returns
 * - OAuth: Redirects to success/error page
 * - Check: JSON response with auth status
 * - Delete: Clears auth session
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { NextRequest } from 'next/server';

import { githubAuthHandlers } from '@/lib/github';

export const runtime = 'edge';

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

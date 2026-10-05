/**
 * GitHub OAuth API route handler.
 * Handles authentication flow with:
 * - OAuth callback processing
 * - Authentication status check
 * - Session cleanup
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { NextRequest } from "next/server";

import { githubAuthHandlers } from "@/lib/github";

// export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { origin: baseUrl, searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  // OAuth callback
  if (code) {
    const result = await githubAuthHandlers.callback(
      code,
      searchParams.get("state")
    );

    if (result.success) {
      return Response.redirect(`${baseUrl}/oauth/github?status=success`);
    }
    const redirectUrl = new URL(`${baseUrl}/oauth/github`);
    redirectUrl.searchParams.set("status", result.error);
    redirectUrl.searchParams.set("description", result.description);
    return Response.redirect(redirectUrl.toString());
  }

  if (searchParams.has("login")) {
    return githubAuthHandlers.login();
  }

  // Regular auth check
  return githubAuthHandlers.check();
}

export function DELETE() {
  return githubAuthHandlers.logout();
}

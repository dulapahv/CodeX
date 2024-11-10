import { NextRequest } from 'next/server';

import { githubAuthHandlers } from '@/lib/github';

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code');

  // OAuth callback
  if (code) {
    const result = await githubAuthHandlers.callback(code);
    return result.success
      ? Response.redirect('/oauth/github?status=success')
      : Response.redirect(
          `/oauth/github?status=${result.error}&description=${result.description}`,
        );
  }

  // Regular auth check
  return githubAuthHandlers.check();
}

export async function DELETE() {
  return githubAuthHandlers.logout();
}

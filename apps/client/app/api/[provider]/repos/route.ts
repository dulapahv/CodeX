/**
 * Lists or searches the connected user's repositories on a git provider.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { NextRequest } from "next/server";

import {
  redirectUriFor,
  requireValid,
  withProvider,
} from "@/lib/git-providers/route";
import { getAccessToken } from "@/lib/git-providers/tokens";

const MAX_QUERY_LENGTH = 100;

export function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/[provider]/repos">
) {
  return withProvider(ctx.params, async (provider) => {
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    requireValid(query.length <= MAX_QUERY_LENGTH);

    const token = await getAccessToken(
      provider,
      redirectUriFor(request, provider)
    );
    return Response.json(await provider.listRepos(token, query || undefined));
  });
}

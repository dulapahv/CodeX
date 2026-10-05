/**
 * Lists a repository's branches on a git provider.
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
import { isValidRepo } from "@/lib/git-providers/validate";

export function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/[provider]/branches">
) {
  return withProvider(ctx.params, async (provider) => {
    const repo = request.nextUrl.searchParams.get("repo") ?? "";
    requireValid(isValidRepo(repo));

    const token = await getAccessToken(
      provider,
      redirectUriFor(request, provider)
    );
    return Response.json(await provider.listBranches(token, repo));
  });
}

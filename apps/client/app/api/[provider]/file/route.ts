/**
 * Reads one file of a repository at a branch on a git provider.
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
import {
  isValidPath,
  isValidRef,
  isValidRepo,
} from "@/lib/git-providers/validate";

export function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/[provider]/file">
) {
  return withProvider(ctx.params, async (provider) => {
    const { searchParams } = request.nextUrl;
    const repo = searchParams.get("repo") ?? "";
    const ref = searchParams.get("ref") ?? "";
    const path = searchParams.get("path") ?? "";
    requireValid(
      isValidRepo(repo) && isValidRef(ref) && path !== "" && isValidPath(path)
    );

    const token = await getAccessToken(
      provider,
      redirectUriFor(request, provider)
    );
    const content = await provider.readFile(token, repo, ref, path);
    return Response.json({ content });
  });
}

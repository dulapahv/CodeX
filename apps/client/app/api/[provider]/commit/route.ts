/**
 * Saves one file to a repository branch on a git provider as a new commit.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { NextRequest } from "next/server";

import { ProviderError } from "@/lib/git-providers/http";
import { redirectUriFor, withProvider } from "@/lib/git-providers/route";
import { getAccessToken } from "@/lib/git-providers/tokens";
import {
  isValidPath,
  isValidRef,
  isValidRepo,
} from "@/lib/git-providers/validate";

const MAX_MESSAGE_LENGTH = 4096;
const MAX_CONTENT_LENGTH = 5_000_000;

const isString = (value: unknown): value is string => typeof value === "string";

export function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/[provider]/commit">
) {
  return withProvider(ctx.params, async (provider) => {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const { repo, branch, path, content, message } = body ?? {};

    if (
      !(
        isString(repo) &&
        isValidRepo(repo) &&
        isString(branch) &&
        isValidRef(branch) &&
        isString(path) &&
        path !== "" &&
        isValidPath(path) &&
        isString(message) &&
        message.trim() !== "" &&
        message.length <= MAX_MESSAGE_LENGTH &&
        isString(content) &&
        content.length <= MAX_CONTENT_LENGTH
      )
    ) {
      throw new ProviderError(400, "Invalid parameter value");
    }

    const token = await getAccessToken(
      provider,
      redirectUriFor(request, provider)
    );
    return Response.json(
      await provider.commitFile(token, {
        repo,
        branch,
        path,
        content,
        message: message.trim(),
      })
    );
  });
}

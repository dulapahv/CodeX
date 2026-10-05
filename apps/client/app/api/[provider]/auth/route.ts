/**
 * Sign-in for a git provider: starts OAuth (?login), handles the callback
 * (?code), reports the connected user, and disconnects (DELETE).
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { type NextRequest, NextResponse } from "next/server";

import { ProviderError } from "@/lib/git-providers/http";
import type { GitProvider } from "@/lib/git-providers/provider";
import { redirectUriFor, withProvider } from "@/lib/git-providers/route";
import {
  clearSession,
  consumeState,
  createState,
  getAccessToken,
  writeSession,
} from "@/lib/git-providers/tokens";

const REFRESH_WINDOW_MS = 5 * 60 * 1000;

const callbackPage = (
  request: NextRequest,
  provider: GitProvider,
  status: string,
  description?: string
) => {
  const url = new URL(`/oauth/${provider.id}`, request.url);
  url.searchParams.set("status", status);
  if (description) {
    url.searchParams.set("description", description);
  }
  return NextResponse.redirect(url);
};

const handleCallback = async (
  request: NextRequest,
  provider: GitProvider,
  code: string
) => {
  const state = request.nextUrl.searchParams.get("state");
  if (!(await consumeState(provider.id, state))) {
    return callbackPage(
      request,
      provider,
      "invalid_state",
      "The sign-in request could not be verified."
    );
  }

  try {
    const tokens = await provider.exchangeCode(
      code,
      redirectUriFor(request, provider)
    );
    await writeSession(provider.id, tokens);
    return callbackPage(request, provider, "success");
  } catch (error) {
    const description =
      error instanceof ProviderError ? error.message : "Sign-in failed.";
    return callbackPage(request, provider, "error", description);
  }
};

const getUser = async (request: NextRequest, provider: GitProvider) => {
  const token = await getAccessToken(
    provider,
    redirectUriFor(request, provider),
    REFRESH_WINDOW_MS
  );
  try {
    return Response.json(await provider.getUser(token));
  } catch (error) {
    // A revoked token stays useless, so forget it
    if (error instanceof ProviderError && error.status === 401) {
      await clearSession(provider.id);
    }
    throw error;
  }
};

export function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/[provider]/auth">
) {
  return withProvider(ctx.params, async (provider) => {
    const { searchParams } = request.nextUrl;

    const code = searchParams.get("code");
    if (code) {
      return handleCallback(request, provider, code);
    }

    // Providers send the user back with ?error when they decline access
    const error = searchParams.get("error");
    if (error) {
      await consumeState(provider.id, searchParams.get("state"));
      return callbackPage(
        request,
        provider,
        error,
        searchParams.get("error_description") ?? undefined
      );
    }

    if (searchParams.has("login")) {
      const state = await createState(provider.id);
      return NextResponse.redirect(
        provider.authorizeUrl(state, redirectUriFor(request, provider))
      );
    }

    return getUser(request, provider);
  });
}

export function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/[provider]/auth">
) {
  return withProvider(ctx.params, async (provider) => {
    await clearSession(provider.id);
    return Response.json({ success: true });
  });
}

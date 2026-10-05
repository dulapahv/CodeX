/**
 * Shared plumbing for the /api/[provider]/* route handlers: provider lookup,
 * error responses and request validation.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ProviderError } from "./http";
import type { GitProvider } from "./provider";
import { getProvider } from "./registry";
import { isProviderId } from "./types";

export const errorResponse = (error: unknown): Response => {
  if (error instanceof ProviderError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Git provider route failed:", error);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
};

export const withProvider = async (
  params: Promise<{ provider: string }>,
  handler: (provider: GitProvider) => Promise<Response>
): Promise<Response> => {
  const { provider: id } = await params;
  if (!isProviderId(id)) {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }

  const provider = getProvider(id);
  if (!provider.isConfigured()) {
    return Response.json(
      { error: `${provider.label} isn't available yet.` },
      { status: 503 }
    );
  }

  try {
    return await handler(provider);
  } catch (error) {
    return errorResponse(error);
  }
};

export const redirectUriFor = (request: Request, provider: GitProvider) =>
  `${new URL(request.url).origin}/api/${provider.id}/auth`;

export const requireValid = (isValid: boolean) => {
  if (!isValid) {
    throw new ProviderError(400, "Invalid parameter value");
  }
};

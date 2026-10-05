/**
 * Server-side HTTP helpers shared by the provider adapters: requests, error
 * mapping and the OAuth token exchange.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export class ProviderError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}

export interface TokenSet {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
}

const MS_PER_SECOND = 1000;

// GitHub, GitLab and Codeberg use `message`; Bitbucket nests it under `error`
const extractMessage = (body: unknown): string | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string") {
    return record.message;
  }
  if (typeof record.error_description === "string") {
    return record.error_description;
  }
  const nested = record.error;
  if (typeof nested === "object" && nested !== null) {
    const message = (nested as Record<string, unknown>).message;
    return typeof message === "string" ? message : null;
  }
  return typeof nested === "string" ? nested : null;
};

const toProviderError = async (
  response: Response,
  label: string
): Promise<ProviderError> => {
  const detail = extractMessage(await response.json().catch(() => null));

  switch (response.status) {
    case 401:
      return new ProviderError(
        401,
        `Your ${label} connection has expired. Connect again.`
      );
    case 403:
      return new ProviderError(
        403,
        "You don't have permission to do that in this repository."
      );
    case 404:
      return new ProviderError(
        404,
        "Not found. It may have been moved or deleted."
      );
    case 409:
    case 422:
      return new ProviderError(
        response.status,
        detail ?? "The file changed or the branch is protected."
      );
    case 429:
      return new ProviderError(
        429,
        `Too many requests to ${label}. Try again in a minute.`
      );
    default:
      return new ProviderError(
        502,
        detail ? `${label}: ${detail}` : `${label} returned an error.`
      );
  }
};

export const send = async (
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> => {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ProviderError(502, `Couldn't reach ${label}.`);
  }
  if (!response.ok) {
    throw await toProviderError(response, label);
  }
  return response;
};

export const sendJson = async <T>(
  url: string,
  init: RequestInit,
  label: string
): Promise<T> => (await send(url, init, label)).json() as Promise<T>;

// Like `send`, but a 404 means "absent" rather than an error
export const sendIfExists = async (
  url: string,
  init: RequestInit,
  label: string
): Promise<Response | null> => {
  try {
    return await send(url, init, label);
  } catch (error) {
    if (error instanceof ProviderError && error.status === 404) {
      return null;
    }
    throw error;
  }
};

export const requestToken = async (
  url: string,
  params: Record<string, string>,
  label: string,
  basicAuth?: { id: string; secret: string }
): Promise<TokenSet> => {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (basicAuth) {
    headers.Authorization = `Basic ${btoa(`${basicAuth.id}:${basicAuth.secret}`)}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: new URLSearchParams(params),
    });
  } catch {
    throw new ProviderError(502, `Couldn't reach ${label}.`);
  }

  const data = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!(response.ok && typeof data?.access_token === "string")) {
    throw new ProviderError(
      401,
      extractMessage(data) ?? `${label} sign-in failed.`
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken:
      typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    expiresAt:
      typeof data.expires_in === "number"
        ? Date.now() + data.expires_in * MS_PER_SECOND
        : undefined,
  };
};

export const encodePath = (path: string): string =>
  path.split("/").map(encodeURIComponent).join("/");

export const toBase64 = (content: string): string =>
  Buffer.from(content, "utf8").toString("base64");

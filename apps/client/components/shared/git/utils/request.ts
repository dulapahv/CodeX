/**
 * Fetch helper for the /api/[provider]/* routes, which reply with `{ error }`
 * on failure.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export const requestJson = async <T>(
  url: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed");
  }
  return body as T;
};

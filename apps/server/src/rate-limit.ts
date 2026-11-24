/**
 * Limits on the requests that make the room server do work, counted for
 * each address, so a script can't run up its usage. Cloudflare keeps the
 * counts in each location and they're approximate, which is plenty to stop
 * a flood.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

// Creating a room, or checking or joining one
export type LimitedRequest = "create" | "join";

interface Limiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

// The bindings these limits use, which the Worker's Env has
export interface RateLimitEnv {
  // Local servers set this to off, since tests make rooms quickly from one
  // address
  RATE_LIMITS: string;
  ROOM_CREATE_LIMITER: Limiter;
  ROOM_JOIN_LIMITER: Limiter;
}

const RETRY_AFTER_SECONDS = 60;

export const isOverLimit = async (
  env: RateLimitEnv,
  request: Request,
  kind: LimitedRequest
): Promise<boolean> => {
  // Cloudflare always says who's asking, so only local tools go without
  const address = request.headers.get("CF-Connecting-IP");
  if (env.RATE_LIMITS !== "on" || !address) {
    return false;
  }
  const limiter =
    kind === "create" ? env.ROOM_CREATE_LIMITER : env.ROOM_JOIN_LIMITER;
  const { success } = await limiter.limit({ key: address });
  return !success;
};

export const tooManyRequests = (headers: HeadersInit) =>
  Response.json(
    { error: "Too many requests. Try again in a minute." },
    {
      headers: { ...headers, "Retry-After": String(RETRY_AFTER_SECONDS) },
      status: 429,
    }
  );

/**
 * The per-address limits on creating, checking and joining rooms, with a
 * stand-in for Cloudflare's limiter. They're off on local servers, so this
 * needs no server.
 * Tests:
 * - Counting each address on its own, for each kind of request
 * - Turning the limits off, and letting requests without an address by
 * - The 429 response
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  isOverLimit,
  type RateLimitEnv,
  tooManyRequests,
} from "../src/rate-limit";

// Allows this many requests for each key, like a limit within one period
const fakeLimiter = (allowed: number) => {
  const counts = new Map<string, number>();
  return {
    keys: () => [...counts.keys()],
    limit: ({ key }: { key: string }) => {
      const count = counts.get(key) ?? 0;
      counts.set(key, count + 1);
      return Promise.resolve({ success: count < allowed });
    },
  };
};

const fromAddress = (address?: string) =>
  new Request("https://codex-server.dulapahv.dev/rooms", {
    headers: address ? { "CF-Connecting-IP": address } : {},
    method: "POST",
  });

const makeEnv = (rateLimits = "on") => {
  const create = fakeLimiter(2);
  const join = fakeLimiter(3);
  const env: RateLimitEnv = {
    RATE_LIMITS: rateLimits,
    ROOM_CREATE_LIMITER: create,
    ROOM_JOIN_LIMITER: join,
  };
  return { create, env, join };
};

describe("Rate limits", () => {
  it("counts each address on its own", async () => {
    const { env } = makeEnv();
    const results: boolean[] = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: the order of the calls is the point
      results.push(await isOverLimit(env, fromAddress("1.1.1.1"), "create"));
    }

    expect(results).toEqual([false, false, true]);
    expect(await isOverLimit(env, fromAddress("2.2.2.2"), "create")).toBe(
      false
    );
  });

  it("counts creating and joining apart", async () => {
    const { create, env, join } = makeEnv();
    await isOverLimit(env, fromAddress("1.1.1.1"), "create");
    await isOverLimit(env, fromAddress("1.1.1.1"), "join");

    expect(create.keys()).toEqual(["1.1.1.1"]);
    expect(join.keys()).toEqual(["1.1.1.1"]);
  });

  it("lets everything by when the limits are off or there's no address", async () => {
    const off = makeEnv("off");
    const on = makeEnv();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: the order of the calls is the point
      expect(await isOverLimit(off.env, fromAddress("1.1.1.1"), "create")).toBe(
        false
      );
      expect(await isOverLimit(on.env, fromAddress(), "create")).toBe(false);
    }

    expect(off.create.keys()).toEqual([]);
    expect(on.create.keys()).toEqual([]);
  });

  it("answers 429 with when to try again", async () => {
    const response = tooManyRequests({ "Access-Control-Allow-Origin": "*" });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await response.json()).toEqual({
      error: "Too many requests. Try again in a minute.",
    });
  });
});

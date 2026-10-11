/**
 * Origins allowed to use the realtime server, for HTTP CORS and WebSocket
 * upgrades alike.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

const ALLOWED_ORIGINS = new Set([
  "https://codex.dulapahv.dev",
  "https://dev-codex.dulapahv.dev",
  "http://localhost:3000",
]);

const DEFAULT_ORIGIN = "https://codex.dulapahv.dev";

// Requests without an Origin header come from non-browser clients (tests,
// health checks), which CORS doesn't apply to
export const isAllowedOrigin = (origin: string | null) =>
  origin === null || ALLOWED_ORIGINS.has(origin);

export const corsHeaders = (origin: string | null): HeadersInit => ({
  "Access-Control-Allow-Origin":
    origin && ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  Vary: "Origin",
});

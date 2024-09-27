export const BASE_SERVER_URL =
  process.env.VERCEL_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENV === "development"
    ? "ws://localhost:3001"
    : "wss://occp-server.dulapahv.workers.dev/";

export const NAME_MAX_LENGTH = 255;

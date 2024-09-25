export const BASE_SERVER_URL =
  process.env.VERCEL_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENV === "development"
    ? "http://localhost:3001"
    : process.env.VERCEL_URL === "preview"
      ? "https://dev-occp-server.dulapahv.dev"
      : "https://occp-server.dulapahv.dev";

export const NAME_MAX_LENGTH = 255;

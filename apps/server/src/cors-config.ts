/**
 * CORS configuration for server request handling.
 * Features:
 * - Origin validation
 * - Vercel deployment detection
 * - Header generation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

const ALLOWED_ORIGINS = [
  'https://codex.dulapahv.dev',
  'https://codex.vercel.app',
  'https://dev-codex.dulapahv.dev',
  'http://localhost:3000',
] as const;

const isVercelDeployment = (origin: string): boolean => {
  const VERCEL_PATTERN =
    /^https:\/\/codex-client-[a-zA-Z0-9]+-[a-zA-Z0-9-]+\.vercel\.app$/;
  return VERCEL_PATTERN.test(origin);
};

const getAllowedOrigin = (origin: string | undefined): string => {
  // For security, avoid returning '*' in production
  if (process.env.NODE_ENV === 'production' && !origin) {
    return ALLOWED_ORIGINS[0];
  }

  if (!origin) return '*';

  if (
    ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number]) ||
    isVercelDeployment(origin)
  ) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
};

const getCorsHeaders = (origin: string | undefined) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Methods': 'GET',
  Vary: 'Origin',
});

export { ALLOWED_ORIGINS, getCorsHeaders, isVercelDeployment };

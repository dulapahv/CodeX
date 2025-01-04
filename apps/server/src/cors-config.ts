const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://kasca.dulapahv.dev',
  'https://dev-kasca.dulapahv.dev',
  'https://kasca.onrender.com',
] as const;

const isVercelDeployment = (origin: string): boolean => {
  const VERCEL_PATTERN =
    /^https:\/\/kasca-client-[a-zA-Z0-9]+-[a-zA-Z0-9-]+\.vercel\.app$/;
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

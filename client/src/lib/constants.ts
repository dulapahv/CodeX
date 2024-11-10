export const IS_DEV_ENV =
  process.env.VERCEL_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENV === 'development' ||
  process.env.NODE_ENV === 'development';

export const BASE_SERVER_URL = IS_DEV_ENV
  ? 'http://localhost:3001'
  : 'https://kasca-server.dulapahv.dev';

export const GITHUB_API_URL = 'https://api.github.com';
export const GITHUB_OAUTH_URL = 'https://github.com/login/oauth';
export const GITHUB_CLIENT_ID = IS_DEV_ENV
  ? 'Ov23liuy4d9jGnpy9t6j'
  : 'Ov23liIuxEK1vcaIKIxP';
export const GITHUB_CLIENT_SECRET = IS_DEV_ENV
  ? process.env.GITHUB_CLIENT_SECRET_DEV
  : process.env.GITHUB_CLIENT_SECRET_PROD;

export const NAME_MAX_LENGTH = 64;

export const IS_DEV_ENV =
  process.env.VERCEL_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENV === 'development' ||
  process.env.NODE_ENV === 'development';

export const BASE_CLIENT_URL = IS_DEV_ENV
  ? 'http://localhost:3000'
  : 'https://kasca.dulapahv.dev';
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

export const SITE_NAME = 'Kasca - Code Collaboration Platform';
export const SHORT_SITE_NAME = 'Kasca';
export const SITE_DESCRIPTION =
  'Kasca is a lightweight online code collaboration platform that enables real-time coding with others, featuring integrated Git support and no sign-up required.';
export const INVITED_DESCRIPTION =
  'You have been invited to a coding session. Happy coding!';
export const SITE_IMAGE_URL = `${BASE_CLIENT_URL}/ogp.png`;
export const THEME_COLOR = '#4a7af6';
export const NAME = 'Dulapah Vibulsanti';
export const PORTFOLIO_URL = 'https://dulapahv.dev';
export const CONTACT_URL = 'https://dulapahv.dev/contact';
export const REPO_URL = 'https://github.com/dulapahv/kasca';
export const GITHUB_URL = 'https://github.com/dulapahv';

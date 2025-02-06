/**
 * Configuration constants for environment, URLs, OAuth and application settings.
 * Features:
 * - Environment detection
 * - API endpoint URLs
 * - OAuth credentials
 * - App metadata
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export const IS_DEV_ENV =
  process.env.VERCEL_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENV === 'development' ||
  process.env.NODE_ENV === 'development';

export const BASE_CLIENT_URL = IS_DEV_ENV
  ? 'http://localhost:3000'
  : 'https://codex.dulapahv.dev';
export const BASE_SERVER_URL = IS_DEV_ENV
  ? 'http://localhost:3001'
  : 'https://codex-server.dulapahv.dev';

export const STATUS_URL = 'https://codex-status.dulapahv.dev';
export const KASCA_SERVER_MONITOR_ID = '2887417';

export const GITHUB_API_URL = 'https://api.github.com';
export const GITHUB_OAUTH_URL = 'https://github.com/login/oauth';
export const GITHUB_CLIENT_ID = IS_DEV_ENV
  ? 'Ov23liuy4d9jGnpy9t6j'
  : 'Ov23liIuxEK1vcaIKIxP';
export const GITHUB_CLIENT_SECRET = IS_DEV_ENV
  ? process.env.GITHUB_CLIENT_SECRET_DEV
  : process.env.GITHUB_CLIENT_SECRET_PROD;

export const NAME_MAX_LENGTH = 64;

export const SITE_NAME = 'CodeX - Code Collaboration Platform';
export const SITE_DESCRIPTION =
  'Your collaborative coding space, reimagined. Code together now on CodeX, no sign-up required.';
export const INVITED_DESCRIPTION =
  'You have been invited to a coding session. Happy coding!';
export const LATENCY_TEST_TITLE = 'Server Latency Test';
export const LATENCY_TEST_DESCRIPTION =
  'Test your latency to the CodeX server.';
export const GITHUB_OAUTH_TITLE = 'GitHub OAuth Callback';
export const GITHUB_OAUTH_DESCRIPTION =
  'This page is used to handle the GitHub OAuth callback.';
export const NAME = 'Dulapah Vibulsanti';
export const PORTFOLIO_URL = 'https://dulapahv.dev';
export const CONTACT_URL = 'https://dulapahv.dev/contact';
export const REPO_URL = 'https://github.com/dulapahv/codex';
export const GITHUB_URL = 'https://github.com/dulapahv';

export const EDITOR_SETTINGS_KEY = 'editor-settings';

export const DISABLE_TAILWIND_CDN_WARN = `<script>(()=>{const w=console.warn;console.warn=(...a)=>{typeof a[0]!=="string"||!a[0].includes("Tailwind CSS")?w.apply(console,a):void 0}})();</script>`;

export const SANDPACK_CDN = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/animate.css@4/animate.min.css" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aos@2/dist/aos.min.css" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2/dist/htmx.min.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/lucide@0" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js" crossorigin="anonymous" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/aos@2/dist/aos.min.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@popperjs/core@2" crossorigin="anonymous"></script>
<script src="https://unpkg.com/tippy.js@6" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/prop-types@15/prop-types.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/recharts@2/umd/Recharts.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1/Sortable.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" crossorigin="anonymous"></script>`;

export const PRE_INSTALLED_LIBS = [
  { name: 'Tailwind CSS', version: '4.x' },
  { name: 'Animate.css', version: '4.x' },
  { name: 'AOS', version: '2.x' },
  { name: 'Swiper', version: '11.x' },
  { name: 'HTMX', version: '2.x' },
  { name: 'Lucide Icons', version: '0.x' },
  { name: 'Alpine.js', version: '3.x' },
  { name: 'GSAP', version: '3.x' },
  { name: 'Popper', version: '2.x' },
  { name: 'Tippy.js', version: '6.x' },
  { name: 'React', version: '18.x' },
  { name: 'React DOM', version: '18.x' },
  { name: 'PropTypes', version: '15.x' },
  { name: 'Recharts', version: '2.x' },
  { name: 'Chart.js', version: '4.x' },
  { name: 'Lodash', version: '4.x' },
  { name: 'Day.js', version: '1.x' },
  { name: 'Sortable.js', version: '1.x' },
];

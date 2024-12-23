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
  'Kasca: Real-time code collaboration with shared terminal, live UI preview, GitHub integration, shared notes, and video/voice chat—no signed-up required.';
export const INVITED_DESCRIPTION =
  'You have been invited to a coding session. Happy coding!';
export const SITE_IMAGE_URL = `${BASE_CLIENT_URL}/ogp.png`;
export const THEME_COLOR = '#4a7af6';
export const NAME = 'Dulapah Vibulsanti';
export const PORTFOLIO_URL = 'https://dulapahv.dev';
export const CONTACT_URL = 'https://dulapahv.dev/contact';
export const REPO_URL = 'https://github.com/dulapahv/kasca';
export const GITHUB_URL = 'https://github.com/dulapahv';

export const SANDPACK_CDN = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp,container-queries"></script>
<script src="https://unpkg.com/htmx.org@2.0.4"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script src="https://unpkg.com/@popperjs/core@2"></script>
<script src="https://unpkg.com/tippy.js@6"></script>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/prop-types/prop-types.min.js"></script>
<script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
<script src="https://unpkg.com/dayjs@1.11.10/dayjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
`;

export const PRE_INSTALLED_LIBS = [
  { name: 'Tailwind CSS', version: '3.x' },
  { name: 'Animate.css', version: '4.1.1' },
  { name: 'AOS', version: '2.3.1' },
  { name: 'Swiper', version: '11.x' },
  { name: 'HTMX', version: '2.0.4' },
  { name: 'Lucide Icons', version: 'latest' },
  { name: 'Alpine.js', version: '3.x' },
  { name: 'GSAP', version: '3.12.5' },
  { name: 'Popper', version: '2.x' },
  { name: 'Tippy.js', version: '6.x' },
  { name: 'React', version: '18.x' },
  { name: 'React DOM', version: '18.x' },
  { name: 'PropTypes', version: 'latest' },
  { name: 'Recharts', version: 'latest' },
  { name: 'Chart.js', version: 'latest' },
  { name: 'Lodash', version: '4.17.21' },
  { name: 'Day.js', version: '1.11.10' },
  { name: 'Sortable.js', version: '1.15.0' },
];

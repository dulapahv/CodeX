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
  process.env.NEXT_PUBLIC_ENV === "development" ||
  process.env.NODE_ENV === "development";

export const BASE_CLIENT_URL = IS_DEV_ENV
  ? "http://localhost:3000"
  : "https://codex.dulapahv.dev";
export const BASE_SERVER_URL = IS_DEV_ENV
  ? "http://localhost:3001"
  : "https://codex-server.dulapahv.dev";

export const STATUS_URL = "https://codex-status.dulapahv.dev";
export const KASCA_SERVER_MONITOR_ID = "2887417";

export const GITHUB_API_URL = "https://api.github.com";
export const GITHUB_USER_AGENT = "codex-client";
export const GITHUB_OAUTH_URL = "https://github.com/login/oauth";
export const GITHUB_CLIENT_ID = IS_DEV_ENV
  ? "Ov23liuy4d9jGnpy9t6j"
  : "Ov23liIuxEK1vcaIKIxP";
export const GITHUB_CLIENT_SECRET = IS_DEV_ENV
  ? process.env.GITHUB_CLIENT_SECRET_DEV
  : process.env.GITHUB_CLIENT_SECRET_PROD;

// Each environment sets its own OAuth app; a provider without one stays
// listed but unavailable
export const GITLAB_URL = "https://gitlab.com";
export const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID ?? "";
export const { GITLAB_CLIENT_SECRET } = process.env;

export const BITBUCKET_URL = "https://bitbucket.org";
export const BITBUCKET_API_URL = "https://api.bitbucket.org/2.0";
export const BITBUCKET_CLIENT_ID = process.env.BITBUCKET_CLIENT_ID ?? "";
export const { BITBUCKET_CLIENT_SECRET } = process.env;

export const CODEBERG_URL = "https://codeberg.org";
export const CODEBERG_CLIENT_ID = process.env.CODEBERG_CLIENT_ID ?? "";
export const { CODEBERG_CLIENT_SECRET } = process.env;

export const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

export const NAME_MAX_LENGTH = 64;

export const ROOM_ENDED_KEY = "codex-room-ended";

export const SITE_NAME = "CodeX - Code Collaboration Platform";
export const SITE_DESCRIPTION =
  "Your collaborative coding space, reimagined. Code together now on CodeX, no sign-up required.";
export const INVITED_DESCRIPTION =
  "You have been invited to a coding session. Happy coding!";
export const LATENCY_TEST_TITLE = "Server Latency Test";
export const LATENCY_TEST_DESCRIPTION =
  "Test your latency to the CodeX server.";
export const OAUTH_TITLE = "Sign-in Callback";
export const OAUTH_DESCRIPTION =
  "This page completes signing in to a git hosting provider.";
export const NAME = "Dulapah Vibulsanti";
export const PORTFOLIO_URL = "https://dulapahv.dev";
export const CONTACT_URL = "https://dulapahv.dev/contact";
export const REPO_URL = "https://github.com/dulapahv/codex";
export const GITHUB_URL = "https://github.com/dulapahv";

export const EDITOR_SETTINGS_KEY = "editor-settings";

export const DISABLE_TAILWIND_CDN_WARN = `<script>(()=>{const w=console.warn;console.warn=(...a)=>{typeof a[0]!=="string"||!a[0].includes("Tailwind CSS")?w.apply(console,a):void 0}})();</script>`;

export interface PreviewFile {
  defer?: boolean;
  kind: "script" | "style";
  url: string;
}

export interface PreviewLib {
  files: readonly PreviewFile[];
  name: string;
  usage?: RegExp;
  version: string;
}

// Each library loads only when its usage pattern matches the code, and a
// pattern also matches the libraries that depend on it
export const PREVIEW_LIBS: readonly PreviewLib[] = [
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
      },
    ],
    name: "Tailwind CSS",
    version: "4.x",
  },
  {
    files: [
      {
        kind: "style",
        url: "https://cdn.jsdelivr.net/npm/animate.css@4/animate.min.css",
      },
    ],
    name: "Animate.css",
    usage: /animate__/u,
    version: "4.x",
  },
  {
    files: [
      {
        kind: "style",
        url: "https://cdn.jsdelivr.net/npm/aos@2/dist/aos.min.css",
      },
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/aos@2/dist/aos.min.js",
      },
    ],
    name: "AOS",
    usage: /\bAOS\b|data-aos/u,
    version: "2.x",
  },
  {
    files: [
      {
        kind: "style",
        url: "https://cdn.jsdelivr.net/npm/swiper@14/swiper-bundle.min.css",
      },
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/swiper@14/swiper-bundle.min.js",
      },
    ],
    name: "Swiper",
    usage: /swiper/iu,
    version: "14.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/htmx.org@2/dist/htmx.min.js",
      },
    ],
    name: "HTMX",
    usage: /\bhx-|htmx/u,
    version: "2.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/lucide@1/dist/umd/lucide.min.js",
      },
    ],
    name: "Lucide Icons",
    usage: /lucide/u,
    version: "1.x",
  },
  {
    files: [
      {
        defer: true,
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js",
      },
    ],
    name: "Alpine.js",
    usage: /\bx-(?:data|init)\b|alpine/iu,
    version: "3.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js",
      },
    ],
    name: "GSAP",
    usage: /gsap|ScrollTrigger/u,
    version: "3.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js",
      },
    ],
    name: "GSAP ScrollTrigger",
    usage: /ScrollTrigger/u,
    version: "3.x",
  },
  {
    files: [{ kind: "script", url: "https://unpkg.com/@popperjs/core@2" }],
    name: "Popper",
    usage: /Popper|tippy/u,
    version: "2.x",
  },
  {
    files: [{ kind: "script", url: "https://unpkg.com/tippy.js@6" }],
    name: "Tippy.js",
    usage: /tippy/u,
    version: "6.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js",
      },
    ],
    name: "React",
    usage: /\bReact|Recharts/u,
    version: "18.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js",
      },
    ],
    name: "React DOM",
    usage: /ReactDOM|Recharts/u,
    version: "18.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/react-is@18/umd/react-is.production.min.js",
      },
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/recharts@3/umd/Recharts.js",
      },
    ],
    name: "Recharts",
    usage: /Recharts/u,
    version: "3.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/htm@3/dist/htm.umd.js",
      },
    ],
    name: "htm",
    usage: /\bhtm\b/u,
    version: "3.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js",
      },
    ],
    name: "Chart.js",
    usage: /\bChart\b/u,
    version: "4.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js",
      },
    ],
    name: "Lodash",
    usage: /\b_[.(]|lodash/u,
    version: "4.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js",
      },
    ],
    name: "Day.js",
    usage: /dayjs/u,
    version: "1.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/sortablejs@1/Sortable.min.js",
      },
    ],
    name: "Sortable.js",
    usage: /Sortable/u,
    version: "1.x",
  },
  {
    files: [
      {
        kind: "script",
        url: "https://cdn.jsdelivr.net/npm/canvas-confetti@1/dist/confetti.browser.min.js",
      },
    ],
    name: "canvas-confetti",
    usage: /confetti/u,
    version: "1.x",
  },
];

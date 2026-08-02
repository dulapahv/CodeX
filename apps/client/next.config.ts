/**
 * Next.js configuration for the client application.
 * Features:
 * - Sentry error tracking
 * - Package optimization
 * - Image domains
 * - Turbo config
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  reactCompiler: true,
  poweredByHeader: false,
  typedRoutes: true,
  logging: {
    browserToTerminal: true,
  },
  experimental: {
    typedEnv: true,
    inlineCss: true,
    turbopackFileSystemCacheForBuild: true,
    turbopackServerSideNestedAsyncChunking: true,
    cssChunking: "strict",
    optimizePackageImports: [
      "@mdxeditor/editor",
      "@monaco-editor/react",
      "monaco-editor",
    ],
    externalDir: true,
  },
  // Cloudflare generates/validates etags at the edge — skipping Next's
  // etag hashing saves per-request CPU on CF Workers.
  generateEtags: false,
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  transpilePackages: ["monaco-themes"],
};

const isCi = process.env.CI === "true";

export default withSentryConfig(nextConfig, {
  org: "dulapahv",
  project: "codex",
  silent: !process.env.CI, // Only print logs for uploading source maps in CI
  widenClientFileUpload: true, // Upload a larger set of source maps for prettier stack traces (increases build time)
  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring", // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // hideSourceMaps: true, // Hides source maps from generated client bundles
  disableLogger: true, // Automatically tree-shake Sentry logger statements to reduce bundle size
  // Automatically upload source maps for all Next.js pages
  sourcemaps: {
    deleteSourcemapsAfterUpload: isCi,
  },
  telemetry: !isCi, // Disable Sentry telemetry in CI
});

initOpenNextCloudflareForDev();

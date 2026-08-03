/**
 * This file configures the initialization of Sentry on the server.
 *
 * Modified by Dulapah Vibulsanti (https://dulapahv.dev) from auto-generated
 * code by Sentry CLI.
 */

import * as Sentry from "@sentry/nextjs";

import { IS_DEV_ENV } from "@/lib/constants";

// Don't initialize Sentry in CI
const isCi = process.env.CI === "true";

if (!isCi) {
  Sentry.init({
    // NEXT_PUBLIC_ so one build-time value covers both bundles. The DSN is public
    // by design, and inlining it avoids needing a separate Worker var at runtime.
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: !IS_DEV_ENV, // Disable Sentry in development
    // Sample rate for performance monitoring. Every Worker request becomes a
    // transaction, so sample in production rather than sending all of them.
    tracesSampleRate: IS_DEV_ENV ? 1 : 0.1,
    debug: false, // Print useful information to the console while setting up Sentry
  });
}

/**
 * This file configures the initialization of Sentry on the client.
 *
 * Modified by Dulapah Vibulsanti (https://dulapahv.dev) from auto-generated
 * code by Sentry CLI.
 */

import * as Sentry from "@sentry/nextjs";

import { IS_DEV_ENV } from "@/lib/constants";

// Don't initialize Sentry in CI. This must be a NEXT_PUBLIC_ var: Next.js only
// inlines those into the browser bundle, so a bare `process.env.CI` check here
// folds to `undefined` and the guard silently never fires.
const isCi = process.env.NEXT_PUBLIC_CI === "true";

if (!isCi) {
  Sentry.init({
    dsn: "https://fa46ee0c923d1b354dd7829624efb99a@o4506180276518912.ingest.us.sentry.io/4508365072760832",
    enabled: !IS_DEV_ENV, // Disable Sentry in development
    integrations: [Sentry.replayIntegration()], // Enable replay for client-side errors
    tracesSampleRate: IS_DEV_ENV ? 1 : 0.1, // Sample rate for performance monitoring
    replaysSessionSampleRate: 0.1, // Sample rate for session replay
    replaysOnErrorSampleRate: 1.0, // Sample rate for error replay
    debug: false, // Print useful information to the console while setting up Sentry
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

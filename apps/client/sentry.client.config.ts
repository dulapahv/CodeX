/**
 * This file configures the initialization of Sentry on the client.
 *
 * Modified by Dulapah Vibulsanti (https://dulapahv.dev) from auto-generated
 * code by Sentry CLI.
 */

import * as Sentry from '@sentry/nextjs';

import { IS_DEV_ENV } from '@/lib/constants';

// Don't initialize Sentry in CI
const isCi = process.env.CI === 'true';

if (!isCi) {
  Sentry.init({
    dsn: 'https://fa46ee0c923d1b354dd7829624efb99a@o4506180276518912.ingest.us.sentry.io/4508365072760832',
    enabled: !IS_DEV_ENV, // Disable Sentry in development
    integrations: [Sentry.replayIntegration()], // Enable replay for client-side errors
    tracesSampleRate: 1, // Sample rate for performance monitoring
    replaysSessionSampleRate: 0.1, // Sample rate for session replay
    replaysOnErrorSampleRate: 1.0, // Sample rate for error replay
    debug: false, // Print useful information to the console while setting up Sentry
  });
}

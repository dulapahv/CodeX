/**
 * This file configures the initialization of Sentry on the server.
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
    tracesSampleRate: 1, // Sample rate for performance monitoring
    debug: false, // Print useful information to the console while setting up Sentry
  });
}

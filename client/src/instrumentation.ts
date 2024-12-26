import * as Sentry from '@sentry/nextjs';

const isCi = process.env.CI === 'true';

export async function register() {
  if (!isCi) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('../sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('../sentry.edge.config');
    }
  }
}

// Only capture errors when not in CI
export const onRequestError = isCi ? undefined : Sentry.captureRequestError;

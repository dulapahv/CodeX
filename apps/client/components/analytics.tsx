/**
 * Analytics component that integrates Vercel Analytics with room URL filtering.
 * Features:
 * - Custom URL filtering
 * - Room ID removal
 * - Homepage tracking
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import {
  Analytics as VercelAnalytics,
  type BeforeSendEvent,
} from '@vercel/analytics/next';

const Analytics = () => (
  <VercelAnalytics
    beforeSend={(event: BeforeSendEvent) => {
      const url = new URL(event.url);
      url.searchParams.delete('room');
      if (url.pathname === '/') {
        return {
          ...event,
          url: url.toString(),
        };
      }
      return null;
    }}
  />
);

export { Analytics };

'use client';

import {
  Analytics as VercelAnalytics,
  type BeforeSendEvent,
} from '@vercel/analytics/next';

export function Analytics() {
  return (
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
}

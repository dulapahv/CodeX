/**
 * Robots.txt configuration that defines crawler access rules.
 * Specifies:
 * - Allowed paths
 * - Disallowed paths
 * - Host URL
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { MetadataRoute } from 'next';

import { BASE_CLIENT_URL } from '@/lib/constants';

// export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/room/*', '/oauth/*', '/test/*', '/api/*'],
      },
    ],
    host: BASE_CLIENT_URL,
  };
}

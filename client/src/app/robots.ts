import { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/constants';

export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/room/*', // Block all URLs that start with /room/
      },
    ],
    host: SITE_URL,
  };
}

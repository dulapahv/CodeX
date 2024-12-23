/**
 * Root layout component for the room pages.
 * Provides a simple pass-through layout that renders its children directly.
 *
 * @remarks
 * The metadata is set to be different from the home page so that when a user
 * shares a room link, the preview will show the room's metadata with an
 * invitation message.
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ReactNode } from 'react';
import type { Metadata } from 'next';

import {
  BASE_CLIENT_URL,
  INVITED_DESCRIPTION,
  NAME,
  PORTFOLIO_URL,
  SHORT_SITE_NAME,
  SITE_NAME,
  THEME_COLOR,
} from '@/lib/constants';

/**
 * The metadata is set to be different from the home page so that when a user
 * shares a room link, the preview will show the room's metadata.
 */
export const metadata: Metadata = {
  title: SITE_NAME,
  description: INVITED_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: SHORT_SITE_NAME,
  referrer: 'origin-when-cross-origin',
  keywords: ['kasca', 'code', 'collaboration', 'platform'],
  creator: NAME,
  publisher: NAME,
  authors: {
    name: NAME,
    url: PORTFOLIO_URL,
  },
  twitter: {
    title: SITE_NAME,
    description: INVITED_DESCRIPTION,
    card: 'summary_large_image',
    creator: '@dulapahv',
    site: '@dulapahv',
    images: [
      {
        url: '/images/cover.png',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  openGraph: {
    title: SITE_NAME,
    description: INVITED_DESCRIPTION,
    siteName: SITE_NAME,
    url: BASE_CLIENT_URL,
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/cover.png',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: new URL(BASE_CLIENT_URL),
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      {
        url: '/images/favicon.ico',
        type: 'image/x-icon',
        sizes: 'any',
      },
      {
        url: '/images/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        url: '/images/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/images/favicon-96x96.png',
        type: 'image/png',
        sizes: '96x96',
      },
      {
        url: '/images/favicon-128x128.png',
        type: 'image/png',
        sizes: '128x128',
      },
      {
        url: '/images/favicon-196x196.png',
        type: 'image/png',
        sizes: '196x196',
      },
    ],
    apple: [
      { url: '/images/favicon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/images/favicon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/images/favicon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/images/favicon-76x76.png', sizes: '76x76', type: 'image/png' },
      {
        url: '/images/favicon-114x114.png',
        sizes: '114x114',
        type: 'image/png',
      },
      {
        url: '/images/favicon-120x120.png',
        sizes: '120x120',
        type: 'image/png',
      },
      {
        url: '/images/favicon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        url: '/images/favicon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        url: '/images/favicon-180x180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  alternates: {
    canonical: BASE_CLIENT_URL,
  },
  other: {
    'msapplication-TileColor': THEME_COLOR,
    'msapplication-TileImage': '/images/mstile-144x144.png',
    'msapplication-square70x70logo': '/images/mstile-70x70.png',
    'msapplication-square150x150logo': '/images/mstile-150x150.png',
    'msapplication-wide310x150logo': '/images/mstile-310x150.png',
    'msapplication-square310x310logo': '/images/mstile-310x310.png',
  },
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return children;
}

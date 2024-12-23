/**
 * Root layout component that provides the base structure and providers for
 * the application.
 * Handles theme, tooltips, toasts and global styles.
 *
 * @remarks
 * This layout:
 * - Sets up theme support via [`ThemeProvider`]
 *   (src/components/theme-provider.tsx)
 * - Provides tooltip functionality via [`TooltipProvider`]
 *   (src/components/ui/tooltip.tsx)
 * - Adds toast notifications via [`Toaster`](src/components/ui/sonner.tsx)
 * - Uses Geist Sans font from the geist package
 * - Sets default metadata for SEO
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';

import {
  BASE_CLIENT_URL,
  NAME,
  PORTFOLIO_URL,
  SHORT_SITE_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  THEME_COLOR,
} from '@/lib/constants';
import { Analytics } from '@/components/analytics';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
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
    description: SITE_DESCRIPTION,
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
    description: SITE_DESCRIPTION,
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
    index: true,
    follow: true,
  },
  metadataBase: new URL(BASE_CLIENT_URL),
  formatDetection: {
    telephone: false,
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
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': THEME_COLOR,
    'msapplication-TileImage': '/images/mstile-144x144.png',
    'msapplication-square70x70logo': '/images/mstile-70x70.png',
    'msapplication-square150x150logo': '/images/mstile-150x150.png',
    'msapplication-wide310x150logo': '/images/mstile-310x150.png',
    'msapplication-square310x310logo': '/images/mstile-310x310.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef1f7' },
    { media: '(prefers-color-scheme: dark)', color: '#101723' },
  ],
  initialScale: 1,
  userScalable: true,
  minimumScale: 1,
  maximumScale: 5,
  width: 'device-width',
  viewportFit: 'cover',
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body className="h-dvh text-pretty antialiased">
        <Analytics />
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster
            richColors
            className="whitespace-pre-line"
            pauseWhenPageIsHidden
            containerAriaLabel="Toast Notifications"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

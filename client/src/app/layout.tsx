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
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/lib/constants';
import { Analytics } from '@/components/analytics';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  keywords:
    'kasca, code collaboration, real-time coding, pair programming, remote collaboration, live coding, code sharing, collaborative editor, monaco editor, cursor sharing, live preview, video chat, collaborative terminal, shared terminal, code execution, GitHub integration, web IDE, online IDE, collaborative development, coding platform, programming tools',
  creator: NAME,
  publisher: NAME,
  authors: {
    name: NAME,
    url: PORTFOLIO_URL,
  },
  metadataBase: new URL(BASE_CLIENT_URL),
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: BASE_CLIENT_URL,
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@dulapahv',
  },
  alternates: {
    canonical: BASE_CLIENT_URL,
  },
};

export const viewport: Viewport = {
  themeColor: '#101723',
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

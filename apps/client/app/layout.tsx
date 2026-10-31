/**
 * Root layout component that wraps all pages.
 * Provides global configuration and providers including:
 * - Fonts (Geist Sans and Mono)
 * - Metadata and SEO settings
 * - Theme provider
 * - Toast notifications
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  BASE_CLIENT_URL,
  NAME,
  PORTFOLIO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/constants";

import "./globals.css";

// export const runtime = 'edge';

const SOCIAL_IMAGE = {
  alt: `${SITE_NAME}. ${SITE_DESCRIPTION}`,
  height: 630,
  url: "/opengraph-image.png",
  width: 1200,
} as const;

export const metadata: Metadata = {
  alternates: {
    canonical: BASE_CLIENT_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  applicationName: SITE_NAME,
  authors: {
    name: NAME,
    url: PORTFOLIO_URL,
  },
  creator: NAME,
  description: SITE_DESCRIPTION,
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-icon.png",
    icon: [
      { sizes: "any", url: "/favicon.ico" },
      { type: "image/svg+xml", url: "/icon.svg" },
    ],
  },
  keywords:
    "codex, code collaboration, real-time coding, pair programming, remote collaboration, live coding, code sharing, collaborative editor, monaco editor, cursor sharing, live preview, video chat, collaborative terminal, shared terminal, code execution, GitHub integration, web IDE, online IDE, collaborative development, coding platform, programming tools",
  metadataBase: new URL(BASE_CLIENT_URL),
  openGraph: {
    images: [SOCIAL_IMAGE],
    locale: "en_US",
    siteName: SITE_NAME,
    type: "website",
    url: BASE_CLIENT_URL,
  },
  publisher: NAME,
  referrer: "origin-when-cross-origin",
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  twitter: {
    card: "summary_large_image",
    creator: "@dulapahv",
    images: [SOCIAL_IMAGE],
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
  userScalable: false,
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body className="h-dvh text-pretty antialiased">
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

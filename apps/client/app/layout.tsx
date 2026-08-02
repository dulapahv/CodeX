/**
 * Root layout component that wraps all pages.
 * Provides global configuration and providers including:
 * - Fonts (Geist Sans and Mono)
 * - Metadata and SEO settings
 * - Theme provider
 * - Toast notifications
 * - Analytics
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}. ${SITE_DESCRIPTION}`,
} as const;

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  keywords:
    "codex, code collaboration, real-time coding, pair programming, remote collaboration, live coding, code sharing, collaborative editor, monaco editor, cursor sharing, live preview, video chat, collaborative terminal, shared terminal, code execution, GitHub integration, web IDE, online IDE, collaborative development, coding platform, programming tools",
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
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: BASE_CLIENT_URL,
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@dulapahv",
    images: [SOCIAL_IMAGE],
  },
  alternates: {
    canonical: BASE_CLIENT_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  maximumScale: 1,
  viewportFit: "cover",
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
        <Analytics />
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster
            className="whitespace-pre-line"
            containerAriaLabel="Toast Notifications"
            pauseWhenPageIsHidden
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

/**
 * Root layout component for the git provider OAuth callback.
 * Provides:
 * - Metadata configuration for OAuth pages
 * - Suspense boundary for async components
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { OAUTH_DESCRIPTION, OAUTH_TITLE } from "@/lib/constants";

export const metadata: Metadata = {
  description: OAUTH_DESCRIPTION,
  title: OAUTH_TITLE,
};

export default function RootLayout({
  children,
}: LayoutProps<"/oauth/[provider]">) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

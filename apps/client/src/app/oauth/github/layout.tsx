/**
 * Root layout component for the GitHub OAuth authentication flow.
 * Provides:
 * - Metadata configuration for OAuth pages
 * - Suspense boundary for async components
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Suspense, type ReactNode } from 'react';
import type { Metadata } from 'next';

import { GITHUB_OAUTH_DESCRIPTION, GITHUB_OAUTH_TITLE } from '@/lib/constants';

export const metadata: Metadata = {
  title: GITHUB_OAUTH_TITLE,
  description: GITHUB_OAUTH_DESCRIPTION,
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

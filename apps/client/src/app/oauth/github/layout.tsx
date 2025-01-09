import { Suspense, type ReactNode } from 'react';
import type { Metadata } from 'next';

import { GITHUB_OAUTH_DESCRIPTION, GITHUB_OAUTH_TITLE } from '@/lib/constants';

export const dynamic = 'force-static';

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

import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kasca - Code Collaboration Platform',
  description:
    'You have been invited to a coding session! Collaborate with others in real-time.',
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return children;
}

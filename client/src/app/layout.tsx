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
 * Created by Dulapah Vibulsanti (https://dulapahv.dev).
 */

import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';

import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';

export const metadata: Metadata = {
  title: 'Kasca - Code Collaboration Platform',
  description:
    'Kasca is a code collaboration platform that allows you to code with others in real-time.',
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('h-dvh', GeistSans.className)}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors className="whitespace-pre-line" />
        </ThemeProvider>
      </body>
    </html>
  );
}

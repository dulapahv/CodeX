/**
 * Root layout component for invited room pages.
 * Provides custom metadata for room sharing previews when users share room links.
 * Features:
 * - Custom metadata description for room sharing
 * - Pass-through children rendering
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import { INVITED_DESCRIPTION } from '@/lib/constants';

/**
 * The metadata is set to be different from the home page so that when a user
 * shares a room link, the preview will show the room's metadata.
 */
export const metadata: Metadata = {
  description: INVITED_DESCRIPTION,
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <div className="h-full overflow-y-hidden">{children}</div>;
}

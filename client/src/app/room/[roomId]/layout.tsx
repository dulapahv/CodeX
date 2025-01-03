/**
 * Root layout component for the room pages.
 * Provides a simple pass-through layout that renders its children directly.
 *
 * @remarks
 * The metadata is set to be different from the home page so that when a user
 * shares a room link, the preview will show the room's metadata with an
 * invitation message.
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
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
  return children;
}

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

import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const runtime = 'edge';

/**
 * The metadata is set to be different from the home page so that when a user
 * shares a room link, the preview will show the room's metadata.
 */
export const metadata: Metadata = {
  description:
    'You have been invited to a coding session! Collaborate with others in real-time.',
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return children;
}

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

import { SHORT_SITE_NAME, SITE_NAME } from '@/lib/constants';

/**
 * The metadata is set to be different from the home page so that when a user
 * shares a room link, the preview will show the room's metadata.
 */
export const generateMetadata = async ({
  params,
}: {
  params: { roomId: string };
}): Promise<Metadata> => {
  const roomName = params.roomId;
  const title = `Room ID ${roomName} | ${SITE_NAME}`;
  const description = `You've been invited to join the coding session on ${SHORT_SITE_NAME}, room ID ${roomName}. Happy coding!`;

  return {
    title,
    description,
    twitter: {
      title,
      description,
    },
    openGraph: {
      title,
      description,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return children;
}

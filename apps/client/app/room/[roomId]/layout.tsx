/**
 * Root layout component for invited room pages.
 * Provides custom metadata for room sharing previews when users share room links.
 * Features:
 * - Custom metadata description for room sharing
 * - Sends fresh page loads to the join form
 * - Pass-through children rendering
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { INVITED_DESCRIPTION } from "@/lib/constants";

/**
 * The metadata is set to be different from the home page so that when a user
 * shares a room link, the preview will show the room's metadata.
 */
export const metadata: Metadata = {
  description: INVITED_DESCRIPTION,
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/room/[roomId]">) {
  // The name to join with only lives in memory, so an invite link or a reload
  // goes straight to the join form instead of flashing the editor first
  if ((await headers()).get("sec-fetch-dest") === "document") {
    const { roomId } = await params;
    redirect(`/?room=${encodeURIComponent(roomId)}`);
  }

  return <div className="h-full overflow-y-hidden">{children}</div>;
}

/**
 * Main notepad component that provides collaborative Markdown editing.
 * Features:
 * - Real-time collaborative editing
 * - Rich text formatting tools
 * - Markdown syntax support
 * - Image and table insertion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";

import { useRoom } from "@/lib/realtime/room-context";

import { EditorSkeleton } from "./components/editor-skeleton";

const DynamicNotepadMain = dynamic(
  () =>
    import("./components/notepad-main").then((mod) => mod.MarkdownEditorMain),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

// The editor starts from the shared notes, so wait for the first sync
const Notepad = () => {
  const room = useRoom();
  const [isSynced, setIsSynced] = useState(room.isSynced);

  useEffect(() => {
    if (room.isSynced()) {
      setIsSynced(true);
      return;
    }
    return room.onSynced(() => setIsSynced(true));
  }, [room]);

  return isSynced ? (
    <Suspense fallback={null}>
      <DynamicNotepadMain />
    </Suspense>
  ) : (
    <EditorSkeleton />
  );
};

export { Notepad };

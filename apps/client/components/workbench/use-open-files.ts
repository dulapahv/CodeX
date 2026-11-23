/**
 * Which file each person in the room has open, by their user ID.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Presence } from "@codex/types/realtime";
import { useMemo } from "react";

import { usePresenceSelector } from "@/lib/realtime/room-context";
import { MAIN_FILE_ID } from "@/lib/realtime/room-files";

// A string, so presence changes that move no one between files are ignored.
// People from before multiple files were always in the first file
const selectOpenFiles = (states: Map<number, Presence>) =>
  [...states]
    .map(([clientId, state]) => `${clientId}:${state.file ?? MAIN_FILE_ID}`)
    .join("\n");

export const useOpenFiles = () => {
  const lines = usePresenceSelector(selectOpenFiles, Object.is);
  return useMemo(
    () =>
      new Map(
        lines
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const colon = line.indexOf(":");
            return [line.slice(0, colon), line.slice(colon + 1)] as const;
          })
      ),
    [lines]
  );
};

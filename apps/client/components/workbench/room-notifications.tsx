/**
 * Notifications in the corner, like VS Code's: people joining and leaving,
 * changes others make to the files, and runs finishing out of sight.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { META_ACTIVITY, ROOM_DOC } from "@codex/types/realtime";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type * as Y from "yjs";

import { isRunError, isRunOutput } from "@/components/terminal/utils";
import { Toaster } from "@/components/ui/sonner";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import {
  useRoomConnection,
  useRoomMessage,
  useRoomUsers,
} from "@/lib/realtime/room-context";
import { isFileActivity } from "@/lib/realtime/room-files";

import { useWorkbench } from "./workbench-provider";

// Everyone already in the room shows up just after joining, which isn't news
const SETTLE_DELAY_MS = 3000;

const TOAST_STYLE = {
  "--border-radius": "0px",
  "--normal-bg": "var(--wb-chrome)",
  "--normal-border": "var(--wb-border)",
  "--normal-text": "var(--wb-fg)",
} as React.CSSProperties;

const useFileActivity = () => {
  const room = useRoomConnection();

  useEffect(() => {
    if (!room) {
      return;
    }
    const meta = room.doc.getMap<unknown>(ROOM_DOC.meta);
    // The room's last change arrives with the first sync, which is old news
    let isSynced = room.isSynced();
    const stopWaiting = room.onSynced(() => {
      isSynced = true;
    });

    const observer = (
      event: Y.YMapEvent<unknown>,
      transaction: Y.Transaction
    ) => {
      if (
        !isSynced ||
        transaction.local ||
        !event.keysChanged.has(META_ACTIVITY)
      ) {
        return;
      }
      const activity = meta.get(META_ACTIVITY);
      if (isFileActivity(activity)) {
        toast(`${activity.by} ${activity.message}`, { id: activity.id });
      }
    };

    meta.observe(observer);
    return () => {
      stopWaiting();
      meta.unobserve(observer);
    };
  }, [room]);
};

const useArrivals = () => {
  const users = useRoomUsers();
  const currentUserId = useCurrentUserId();
  const previousRef = useRef<Map<string, string> | null>(null);
  const settledAtRef = useRef(Number.POSITIVE_INFINITY);

  useEffect(() => {
    settledAtRef.current = Date.now() + SETTLE_DELAY_MS;
  }, []);

  useEffect(() => {
    const current = new Map(users.map(({ id, username }) => [id, username]));
    const previous = previousRef.current;
    previousRef.current = current;
    if (!previous || Date.now() < settledAtRef.current) {
      return;
    }
    for (const [id, name] of current) {
      if (!previous.has(id) && id !== currentUserId) {
        toast(`${name} joined the room`);
      }
    }
    for (const [id, name] of previous) {
      if (!current.has(id)) {
        toast(`${name} left the room`);
      }
    }
  }, [currentUserId, users]);
};

// Only runs nobody can see finish, since the terminal shows the rest
const useRunResults = () => {
  const { layout, showPanelView } = useWorkbench();
  const isTerminalShowing =
    layout.isPanelOpen && layout.panelView === "terminal";

  useRoomMessage("terminal", ({ result }) => {
    if (isTerminalShowing || !(isRunOutput(result) || isRunError(result))) {
      return;
    }
    const who = result.runBy ? `${result.runBy}'s` : "A";
    const failed = isRunError(result) || (result.run.code ?? 0) !== 0;
    const show = {
      action: {
        label: "Show Terminal",
        onClick: () => showPanelView("terminal"),
      },
    };
    if (failed) {
      toast.error(`${who} run failed`, show);
    } else {
      toast.success(`${who} run finished`, show);
    }
  });
};

export const RoomNotifications = () => {
  useFileActivity();
  useArrivals();
  useRunResults();

  // Sonner keeps toasts that haven't timed out and shows them again in the
  // next room, so this room's go when it closes
  useEffect(
    () => () => {
      toast.dismiss();
    },
    []
  );

  return (
    <Toaster
      offset={{ bottom: 32, right: 12 }}
      position="bottom-right"
      style={TOAST_STYLE}
    />
  );
};

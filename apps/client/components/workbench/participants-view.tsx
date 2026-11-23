/**
 * Side bar view listing everyone in the room, where you can follow someone
 * or invite more people.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { Presence } from "@codex/types/realtime";
import {
  NavigationArrowIcon,
  PlayIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";

import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useFollowUserId } from "@/hooks/use-follow-user-id";
import { usePresenceSelector, useRoomUsers } from "@/lib/realtime/room-context";
import { storage } from "@/lib/services/storage";
import { cn } from "@/lib/utils";

import { useOpenFiles } from "./use-open-files";
import { WorkbenchAction } from "./view-header";
import { useWorkbench } from "./workbench-provider";

const getRunningIds = (states: Map<number, Presence>) =>
  [...states]
    .filter(([, state]) => state.running)
    .map(([clientId]) => String(clientId))
    .join(",");

export const ParticipantsView = () => {
  const { files, showShare } = useWorkbench();
  const users = useRoomUsers();
  const currentUserId = useCurrentUserId();
  const followUserId = useFollowUserId();
  const runningIds = usePresenceSelector(getRunningIds, Object.is).split(",");
  const openFiles = useOpenFiles();
  const getOpenFileName = (userId: string) =>
    files.files.find(({ id }) => id === openFiles.get(userId))?.name;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul
        aria-label={`${users.length} in this room`}
        className="min-h-0 overflow-y-auto"
      >
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isFollowed = user.id === followUserId;
          const isRunning = runningIds.includes(user.id);
          const openFileName = getOpenFileName(user.id);
          return (
            <li
              className="hover:bg-wb-hover flex h-10 items-center gap-2 pr-2 pl-5 text-[13px]"
              key={user.id}
            >
              <Avatar
                animate={false}
                showTooltip={false}
                size="sm"
                user={user}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">
                  {user.username}
                  {isSelf && <span className="text-wb-muted"> (you)</span>}
                </span>
                {openFileName && (
                  <span className="text-wb-muted truncate text-xs">
                    In {openFileName}
                  </span>
                )}
              </div>
              {isRunning && (
                <span className="text-wb-muted flex shrink-0 items-center gap-1 text-xs">
                  <PlayIcon className="size-3 text-green-500" weight="fill" />
                  Running
                </span>
              )}
              {!isSelf && (
                <WorkbenchAction
                  className={cn("shrink-0", isFollowed && "text-wb-accent")}
                  isPressed={isFollowed}
                  label={
                    isFollowed
                      ? `Stop following ${user.username}`
                      : `Follow ${user.username}`
                  }
                  onClick={() =>
                    storage.setFollowUserId(isFollowed ? null : user.id)
                  }
                >
                  <NavigationArrowIcon
                    weight={isFollowed ? "fill" : "regular"}
                  />
                </WorkbenchAction>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2 px-5 py-3">
        <p className="text-wb-muted text-xs">
          Following someone keeps their part of the code in view as they scroll.
        </p>
        <Button
          className="bg-wb-accent hover:bg-wb-accent/90 h-7 w-full text-xs text-white"
          onClick={showShare}
        >
          <UserPlusIcon aria-hidden="true" className="size-4" />
          <span className="truncate">Invite People</span>
        </Button>
      </div>
    </div>
  );
};

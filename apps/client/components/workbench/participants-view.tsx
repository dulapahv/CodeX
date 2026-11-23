/**
 * Side bar view listing everyone in the room, where you can follow someone
 * or invite more people. The host also decides here who can edit, hands the
 * room to someone else, removes people, and locks the room to newcomers.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { Presence, RoomRole } from "@codex/types/realtime";
import type { User } from "@codex/types/user";
import {
  DotsThreeIcon,
  LockSimpleIcon,
  LockSimpleOpenIcon,
  NavigationArrowIcon,
  PlayIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { Avatar } from "@/components/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useFollowUserId } from "@/hooks/use-follow-user-id";
import {
  usePresenceSelector,
  useRoomAccess,
  useRoomConnection,
  useRoomUsers,
} from "@/lib/realtime/room-context";
import { storage } from "@/lib/services/storage";
import { cn } from "@/lib/utils";

import { useOpenFiles } from "./use-open-files";
import { WorkbenchAction } from "./view-header";
import { useWorkbench } from "./workbench-provider";

const ROLE_LABELS: Record<RoomRole, string | null> = {
  editor: null,
  host: "Host",
  viewer: "View only",
};

// What the host is asked to confirm before it happens
type Confirmation = "host" | "remove";

const CONFIRMATIONS: Record<
  Confirmation,
  {
    action: string;
    description: string;
    title: (name: string) => string;
    variant: "default" | "destructive";
  }
> = {
  host: {
    action: "Make Host",
    description:
      "They can then lock the room, manage people and terminate the room, and you can only edit.",
    title: (name) => `Make ${name} the host?`,
    variant: "default",
  },
  remove: {
    action: "Remove",
    description:
      "They leave the room straight away, and can't join it again from the same browser.",
    title: (name) => `Remove ${name}?`,
    variant: "destructive",
  },
};

const getRunningIds = (states: Map<number, Presence>) =>
  [...states]
    .filter(([, state]) => state.running)
    .map(([clientId]) => String(clientId))
    .join(",");

interface PersonMenuProps {
  isViewer: boolean;
  onConfirm: (confirmation: Confirmation) => void;
  onToggleRole: () => void;
  user: User;
}

// The host's actions for someone else in the room
const PersonMenu = ({
  isViewer,
  onConfirm,
  onToggleRole,
  user,
}: PersonMenuProps) => {
  // These ask first, in a dialog that opens once the menu has closed
  const pendingRef = useRef<Confirmation | null>(null);

  return (
    <DropdownMenu
      onOpenChangeComplete={(open) => {
        const pending = pendingRef.current;
        if (!open && pending) {
          pendingRef.current = null;
          onConfirm(pending);
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={`Manage ${user.username}`}
                  className="text-wb-fg hover:bg-wb-hover hover:text-wb-fg aria-expanded:bg-wb-active size-6 shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  size="icon"
                  variant="ghost"
                >
                  <DotsThreeIcon weight="bold" />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Manage {user.username}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onToggleRole}>
          {isViewer ? "Let Edit" : "Make View Only"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            pendingRef.current = "host";
          }}
        >
          Make Host…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            pendingRef.current = "remove";
          }}
          variant="destructive"
        >
          Remove from Room…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ParticipantsView = () => {
  const { files, showShare } = useWorkbench();
  const room = useRoomConnection();
  const users = useRoomUsers();
  const currentUserId = useCurrentUserId();
  const followUserId = useFollowUserId();
  const { isHost, isLocked, roleOf } = useRoomAccess();
  const [confirming, setConfirming] = useState<{
    kind: Confirmation;
    user: User;
  } | null>(null);
  const confirmation = confirming && CONFIRMATIONS[confirming.kind];
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
          const role = roleOf(user.id);
          const openFileName = getOpenFileName(user.id);
          const details = [
            ROLE_LABELS[role],
            openFileName && `In ${openFileName}`,
          ]
            .filter(Boolean)
            .join(" · ");
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
                {details && (
                  <span className="text-wb-muted truncate text-xs">
                    {details}
                  </span>
                )}
              </div>
              {isRunning && (
                <span className="text-wb-muted flex shrink-0 items-center gap-1 text-xs">
                  <PlayIcon className="size-3 text-green-500" weight="fill" />
                  Running
                </span>
              )}
              {isHost && role !== "host" && (
                <PersonMenu
                  isViewer={role === "viewer"}
                  onConfirm={(kind) => setConfirming({ kind, user })}
                  onToggleRole={() =>
                    room?.send({
                      clientId: Number(user.id),
                      role: role === "viewer" ? "editor" : "viewer",
                      type: "set-role",
                    })
                  }
                  user={user}
                />
              )}
              {!isSelf && (
                <WorkbenchAction
                  className={cn(
                    "shrink-0",
                    isFollowed && "text-wb-follow hover:text-wb-follow"
                  )}
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
          disabled={isLocked}
          onClick={showShare}
        >
          <UserPlusIcon aria-hidden="true" className="size-4" />
          <span className="truncate">Invite People</span>
        </Button>
        {isHost && (
          <Button
            className="border-wb-border text-wb-fg hover:bg-wb-hover hover:text-wb-fg h-7 w-full bg-transparent text-xs dark:bg-transparent"
            onClick={() => room?.send({ locked: !isLocked, type: "lock" })}
            variant="outline"
          >
            {isLocked ? (
              <LockSimpleOpenIcon aria-hidden="true" className="size-4" />
            ) : (
              <LockSimpleIcon aria-hidden="true" className="size-4" />
            )}
            <span className="truncate">
              {isLocked ? "Unlock Room" : "Lock Room"}
            </span>
          </Button>
        )}
        {/* Below the buttons, so they stay put as the room locks */}
        {isLocked && (
          <p className="text-wb-muted flex items-start gap-1.5 text-xs">
            <LockSimpleIcon
              aria-hidden="true"
              className="mt-px size-3.5 shrink-0"
            />
            {isHost
              ? "New people can't join while the room is locked."
              : "The host has locked the room, so new people can't join."}
          </p>
        )}
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
          }
        }}
        open={confirming !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming && confirmation?.title(confirming.user.username)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirming) {
                  room?.send({
                    clientId: Number(confirming.user.id),
                    type: confirming.kind === "host" ? "make-host" : "remove",
                  });
                }
                setConfirming(null);
              }}
              variant={confirmation?.variant}
            >
              {confirmation?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

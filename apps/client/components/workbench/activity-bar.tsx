/**
 * The strip of view icons down the left edge, which picks what the side bar
 * shows, with leaving the room and the manage menu at the bottom.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import {
  FilesIcon,
  GearSixIcon,
  GitBranchIcon,
  type Icon,
  NotebookIcon,
  SignOutIcon,
  UsersIcon,
} from "@phosphor-icons/react";

import { useDeferredMenuAction } from "@/components/toolbar/hooks/use-deferred-menu-action";
import type { ToolbarActions } from "@/components/toolbar/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRoomUsers } from "@/lib/realtime/room-context";
import { cn } from "@/lib/utils";

import { SIDE_BAR_VIEW_LABELS, type SideBarView } from "./types";
import { useWorkbench } from "./workbench-provider";

const VIEWS: { icon: Icon; view: SideBarView }[] = [
  { icon: FilesIcon, view: "explorer" },
  { icon: NotebookIcon, view: "notepad" },
  { icon: UsersIcon, view: "participants" },
  { icon: GitBranchIcon, view: "repository" },
];

const ITEM_CLASS =
  "text-wb-muted hover:text-wb-fg focus-visible:text-wb-fg relative flex size-12 items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-wb-accent focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50";

const ManageMenu = ({
  actions,
  modKey,
}: {
  actions: ToolbarActions;
  modKey: string;
}) => {
  const { restoreFocus, runPendingAction, selectAction } =
    useDeferredMenuAction(actions);

  return (
    <DropdownMenu onOpenChangeComplete={runPendingAction}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <button
                  aria-label="Manage"
                  className={ITEM_CLASS}
                  type="button"
                >
                  <GearSixIcon className="size-6" />
                </button>
              }
            />
          }
        />
        <TooltipContent side="right">Manage</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-56"
        finalFocus={restoreFocus}
        side="right"
      >
        <DropdownMenuItem onClick={() => selectAction("commandPalette")}>
          Command Palette…
          <DropdownMenuShortcut>{modKey}+Shift+P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectAction("settings")}>
          Settings
          <DropdownMenuShortcut>{modKey}+,</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectAction("colorTheme")}>
          Color Theme…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => selectAction("manual")}>
          Manual
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectAction("about")}>
          About
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ActivityBar = () => {
  const { actions, layout, openView, platform, showLeave } = useWorkbench();
  const users = useRoomUsers();
  const modKey = platform === "mac" ? "⌘" : "Ctrl";

  return (
    <nav
      aria-label="Views"
      className="bg-wb-chrome border-wb-border flex w-12 shrink-0 flex-col justify-between border-r"
    >
      <ul>
        {VIEWS.map(({ icon: ViewIcon, view }) => {
          const label = SIDE_BAR_VIEW_LABELS[view];
          const isActive = layout.isSideBarOpen && layout.sideBarView === view;
          return (
            <li key={view}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      aria-label={label}
                      aria-pressed={isActive}
                      className={cn(
                        ITEM_CLASS,
                        isActive &&
                          "text-wb-fg before:bg-wb-accent before:absolute before:inset-y-0 before:left-0 before:w-0.5"
                      )}
                      onClick={() => openView(view)}
                      type="button"
                    >
                      <ViewIcon className="size-6" />
                      {view === "participants" && users.length > 0 && (
                        <span
                          aria-hidden="true"
                          className="bg-wb-accent absolute right-2 bottom-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-white"
                        >
                          {users.length}
                        </span>
                      )}
                    </button>
                  }
                />
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                aria-haspopup="dialog"
                aria-label="Leave room"
                className={cn(ITEM_CLASS, "hover:text-red-500")}
                onClick={showLeave}
                type="button"
              >
                <SignOutIcon className="size-6" />
              </button>
            }
          />
          <TooltipContent side="right">Leave Room ({modKey}+Q)</TooltipContent>
        </Tooltip>
        {actions ? (
          <ManageMenu actions={actions} modKey={modKey} />
        ) : (
          <button
            aria-label="Manage"
            className={ITEM_CLASS}
            disabled
            type="button"
          >
            <GearSixIcon className="size-6" />
          </button>
        )}
      </div>
    </nav>
  );
};

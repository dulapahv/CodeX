/**
 * The room's title bar: menus on the left, a search box that opens the
 * command palette in the middle, and who's here, sharing and layout toggles
 * on the right.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import {
  BrowserIcon,
  ExportIcon,
  MagnifyingGlassIcon,
  SidebarSimpleIcon,
  SquareHalfBottomIcon,
} from "@phosphor-icons/react";
import Image from "next/image";

import { Toolbar } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserList } from "@/components/user-list";
import { useRoomUsers } from "@/lib/realtime/room-context";

import { WorkbenchAction } from "./view-header";
import { useWorkbench } from "./workbench-provider";

export const TitleBar = () => {
  const { layout, platform, roomId, showPalette, showShare, togglePart } =
    useWorkbench();
  const users = useRoomUsers();
  const modKey = platform === "mac" ? "⌘" : "Ctrl";

  // The search box is centred while there's room, and shrinks before it
  // covers the menus
  return (
    <header className="bg-wb-chrome border-wb-border text-wb-fg grid h-9 shrink-0 grid-cols-[minmax(max-content,1fr)_minmax(0,min(38vw,36rem))_minmax(max-content,1fr)] items-center gap-2 border-b px-1">
      <div className="flex min-w-0 items-center">
        <Image
          alt=""
          className="mx-2 size-4 shrink-0"
          height={16}
          src="/images/codex-logo.svg"
          width={16}
        />
        <Toolbar />
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              aria-label="Search commands"
              className="border-wb-border bg-wb-hover text-wb-muted hover:bg-wb-active hover:text-wb-fg flex h-6 w-full min-w-0 items-center justify-center gap-1.5 border px-2 text-xs"
              onClick={showPalette}
              type="button"
            >
              <MagnifyingGlassIcon aria-hidden="true" className="size-3.5" />
              <span className="truncate">CodeX: {roomId}</span>
            </button>
          }
        />
        <TooltipContent side="bottom">
          Search commands ({modKey}+Shift+P)
        </TooltipContent>
      </Tooltip>

      <div className="flex min-w-0 items-center justify-end gap-1">
        <UserList users={users} />
        <Button
          aria-haspopup="dialog"
          aria-label="Share this coding room"
          className="text-wb-fg hover:bg-wb-hover hover:text-wb-fg h-6 gap-1 px-2 text-xs"
          onClick={showShare}
          size="sm"
          variant="ghost"
        >
          <ExportIcon aria-hidden="true" className="size-3.5" />
          Share
        </Button>
        <div aria-hidden="true" className="bg-wb-border mx-1 h-4 w-px" />
        <WorkbenchAction
          isPressed={layout.isSideBarOpen}
          label="Toggle Primary Side Bar"
          onClick={() => togglePart("isSideBarOpen")}
          shortcut={`${modKey}+B`}
        >
          <SidebarSimpleIcon
            weight={layout.isSideBarOpen ? "fill" : "regular"}
          />
        </WorkbenchAction>
        <WorkbenchAction
          isPressed={layout.isPanelOpen}
          label="Toggle Panel"
          onClick={() => togglePart("isPanelOpen")}
          shortcut={`${modKey}+J`}
        >
          <SquareHalfBottomIcon
            weight={layout.isPanelOpen ? "fill" : "regular"}
          />
        </WorkbenchAction>
        <WorkbenchAction
          isPressed={layout.isPreviewOpen}
          label="Toggle Live Preview"
          onClick={() => togglePart("isPreviewOpen")}
        >
          <BrowserIcon weight={layout.isPreviewOpen ? "fill" : "regular"} />
        </WorkbenchAction>
        <WorkbenchAction
          isPressed={layout.isCallOpen}
          label="Toggle Video Call"
          onClick={() => togglePart("isCallOpen")}
        >
          <SidebarSimpleIcon
            className="-scale-x-100"
            weight={layout.isCallOpen ? "fill" : "regular"}
          />
        </WorkbenchAction>
      </div>
    </header>
  );
};

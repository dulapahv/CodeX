/**
 * The status bar along the bottom of the room, laid out like VS Code's.
 * Features:
 * - Room indicator that opens sharing
 * - Participants, problems, running code and following
 * - Cursor position, indentation, encoding, line endings and language
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import {
  ArrowsLeftRightIcon,
  EyeIcon,
  LockSimpleIcon,
  NavigationArrowIcon,
  UsersIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type * as monacoEditor from "monaco-editor";
import { type ComponentProps, useEffect, useRef } from "react";

import { useRunningNames } from "@/components/terminal/components/running-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MARKER_SEVERITY,
  useCursorPosition,
  useIndentation,
  useProblems,
} from "@/components/workbench/use-editor-state";
import { useWorkbench } from "@/components/workbench/workbench-provider";
import { useFollowUserId } from "@/hooks/use-follow-user-id";
import {
  useRoomAccess,
  useRoomUsers,
  VIEW_ONLY_MESSAGE,
} from "@/lib/realtime/room-context";
import { storage } from "@/lib/services/storage";
import { cn } from "@/lib/utils";

import { LanguageSelection } from "./components/language-select";

type Editor = monacoEditor.editor.IStandaloneCodeEditor;

const ITEM_CLASS =
  "hover:bg-wb-hover focus-visible:bg-wb-active flex h-full items-center gap-1 px-1.5 whitespace-nowrap outline-none";

const INDENT_SIZES = [2, 4, 8];

interface StatusItemProps extends ComponentProps<"button"> {
  tooltip?: string;
}

const StatusItem = ({ className, tooltip, ...props }: StatusItemProps) => {
  const button = (
    <button className={cn(ITEM_CLASS, className)} type="button" {...props} />
  );
  if (!tooltip) {
    return button;
  }
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
};

const ProblemsItem = () => {
  const { files, monaco, showPanelView } = useWorkbench();
  const problems = useProblems(files.fileModels, monaco);
  const errors = problems.filter(
    ({ marker }) => marker.severity === MARKER_SEVERITY.error
  ).length;
  const warnings = problems.filter(
    ({ marker }) => marker.severity === MARKER_SEVERITY.warning
  ).length;

  return (
    <StatusItem
      aria-label={`${errors} errors, ${warnings} warnings`}
      onClick={() => showPanelView("problems")}
      tooltip="Problems"
    >
      <XCircleIcon aria-hidden="true" className="size-3.5" />
      {errors}
      <WarningIcon aria-hidden="true" className="ml-1 size-3.5" />
      {warnings}
    </StatusItem>
  );
};

const RunningItem = () => {
  const { showPanelView } = useWorkbench();
  const names = useRunningNames();

  if (names.length === 0) {
    return null;
  }

  return (
    <StatusItem
      onClick={() => showPanelView("terminal")}
      tooltip="Show Terminal"
    >
      <Spinner className="size-3" />
      Running ({names.join(", ")})
    </StatusItem>
  );
};

// Stops following someone who left, and shows who is being followed
const FollowingItem = () => {
  const users = useRoomUsers();
  const followUserId = useFollowUserId();
  const followed = users.find(({ id }) => id === followUserId);

  useEffect(() => {
    if (followUserId && !followed) {
      storage.setFollowUserId(null);
    }
  }, [followUserId, followed]);

  if (!followed) {
    return null;
  }

  return (
    <StatusItem
      onClick={() => storage.setFollowUserId(null)}
      tooltip="Stop following"
    >
      <NavigationArrowIcon
        aria-hidden="true"
        className="text-wb-follow size-3.5"
        weight="fill"
      />
      Following {followed.username}
    </StatusItem>
  );
};

// Why a viewer can't type, and that newcomers are kept out of a locked room
const AccessItems = () => {
  const { showView } = useWorkbench();
  const { canEdit, isLocked } = useRoomAccess();

  return (
    <>
      {!canEdit && (
        <StatusItem
          onClick={() => showView("participants")}
          tooltip={VIEW_ONLY_MESSAGE}
        >
          <EyeIcon aria-hidden="true" className="size-3.5" />
          View only
        </StatusItem>
      )}
      {isLocked && (
        <StatusItem
          onClick={() => showView("participants")}
          tooltip="New people can't join"
        >
          <LockSimpleIcon aria-hidden="true" className="size-3.5" />
          Locked
        </StatusItem>
      )}
    </>
  );
};

const CursorItem = ({ editor }: { editor: Editor }) => {
  const { actions } = useWorkbench();
  const { column, line, selected } = useCursorPosition(editor);

  return (
    <StatusItem onClick={actions?.goToLine} tooltip="Go to Line/Column">
      Ln {line}, Col {column}
      {selected > 0 && ` (${selected} selected)`}
    </StatusItem>
  );
};

// Like VS Code's, this changes only this person's view of the code, while
// Settings holds the defaults
const IndentationItem = ({ editor }: { editor: Editor }) => {
  const indentation = useIndentation(editor);
  const pendingActionRef = useRef<string | null>(null);

  if (!indentation) {
    return null;
  }

  const { insertSpaces, tabSize } = indentation;
  const label = insertSpaces ? `Spaces: ${tabSize}` : `Tab Size: ${tabSize}`;

  const runPendingAction = (open: boolean) => {
    const actionId = pendingActionRef.current;
    if (open || !actionId) {
      return;
    }
    pendingActionRef.current = null;
    editor.focus();
    editor.trigger("statusBar", actionId, null);
  };

  return (
    <DropdownMenu onOpenChangeComplete={runPendingAction}>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={`Indentation, ${label}`}
            className={ITEM_CLASS}
            type="button"
          >
            {label}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-60" side="top">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Indent Using</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={(value) =>
              editor.getModel()?.updateOptions({
                insertSpaces: value === "spaces",
              })
            }
            value={insertSpaces ? "spaces" : "tabs"}
          >
            <DropdownMenuRadioItem value="spaces">Spaces</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="tabs">Tabs</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Size</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={(value) =>
              editor.getModel()?.updateOptions({
                indentSize: Number(value),
                tabSize: Number(value),
              })
            }
            value={String(tabSize)}
          >
            {INDENT_SIZES.map((size) => (
              <DropdownMenuRadioItem key={size} value={String(size)}>
                {size}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            pendingActionRef.current = "editor.action.indentationToSpaces";
          }}
        >
          Convert Indentation to Spaces
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            pendingActionRef.current = "editor.action.indentationToTabs";
          }}
        >
          Convert Indentation to Tabs
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            pendingActionRef.current = "editor.action.detectIndentation";
          }}
        >
          Detect Indentation from Content
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const StatusBar = () => {
  const { editor, files, monaco, roomId, showShare, showView } = useWorkbench();
  const users = useRoomUsers();

  return (
    <section
      aria-label="Status bar"
      className="bg-wb-chrome border-wb-border text-wb-fg/80 flex h-[22px] shrink-0 items-stretch justify-between border-t text-xs"
    >
      <div className="flex min-w-0 items-stretch">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                aria-label={`Room ${roomId}`}
                className="bg-wb-accent flex h-full items-center gap-1 px-2 text-white outline-none hover:brightness-110 focus-visible:brightness-110"
                onClick={showShare}
                type="button"
              >
                <ArrowsLeftRightIcon aria-hidden="true" className="size-3.5" />
                {roomId}
              </button>
            }
          />
          <TooltipContent side="top">Share this room</TooltipContent>
        </Tooltip>
        <StatusItem
          aria-label={`${users.length} participants`}
          onClick={() => showView("participants")}
          tooltip="Participants"
        >
          <UsersIcon aria-hidden="true" className="size-3.5" />
          {users.length}
        </StatusItem>
        <AccessItems />
        <ProblemsItem />
        <RunningItem />
        <FollowingItem />
      </div>
      {editor && monaco && files.activeFile && (
        <div className="flex min-w-0 items-stretch">
          <CursorItem editor={editor} />
          <IndentationItem editor={editor} />
          <span className="flex items-center px-1.5">UTF-8</span>
          <span className="flex items-center px-1.5">LF</span>
          <LanguageSelection className={ITEM_CLASS} />
        </div>
      )}
    </section>
  );
};

export { StatusBar };

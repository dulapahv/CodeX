/**
 * Side bar view listing the room's files, like VS Code's Explorer: open,
 * create, rename, download and delete files, and see who has each one open.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { Presence } from "@codex/types/realtime";
import { type ReactNode, useRef, useState } from "react";

import { saveLocal } from "@/components/toolbar/utils";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  usePresenceSelector,
  useRoomConnection,
} from "@/lib/realtime/room-context";
import { MAIN_FILE_ID, type RoomFile } from "@/lib/realtime/room-files";
import { cn, getBackgroundColor } from "@/lib/utils";

import { FileDropZone } from "./file-drop-zone";
import { FileIcon } from "./file-icon";
import { NameBox } from "./name-box";
import { useWorkbench } from "./workbench-provider";

type RowAction = "delete" | "download" | "newFile" | "open" | "rename";

// Who has each file open, other than this person, as "fileId:name" pairs
const selectViewers = (states: Map<number, Presence>, selfId: number) =>
  [...states]
    .filter(([clientId, state]) => clientId !== selfId && state.user?.name)
    .map(([, state]) => `${state.file ?? MAIN_FILE_ID}:${state.user.name}`)
    .join("\n");

const Viewers = ({ names }: { names: string[] }) => {
  if (names.length === 0) {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={`Open by ${names.join(", ")}`}
            className="ml-auto flex shrink-0 -space-x-1"
            role="img"
          >
            {names.slice(0, 3).map((name) => (
              <span
                className="border-wb-chrome size-2.5 rounded-full border"
                key={name}
                style={{ backgroundColor: getBackgroundColor(name) }}
              />
            ))}
          </span>
        }
      />
      <TooltipContent side="right">Open by {names.join(", ")}</TooltipContent>
    </Tooltip>
  );
};

interface FileRowProps {
  canDelete: boolean;
  file: RoomFile;
  isActive: boolean;
  isRenaming: boolean;
  onAction: (action: RowAction) => void;
  onRenameEnd: () => void;
  viewers: string[];
}

const FileRow = ({
  canDelete,
  file,
  isActive,
  isRenaming,
  onAction,
  onRenameEnd,
  viewers,
}: FileRowProps) => {
  const { files } = useWorkbench();
  // Runs once the menu has closed, so renaming can take the focus
  const pendingActionRef = useRef<RowAction | null>(null);

  const rowClass = cn(
    "flex h-[22px] w-full items-center gap-1.5 pr-2 pl-5 text-left text-[13px]",
    isActive ? "bg-wb-active text-wb-fg" : "hover:bg-wb-hover"
  );

  if (isRenaming) {
    return (
      <li className={rowClass}>
        <FileIcon languageId={file.language} />
        <NameBox
          className="flex-1"
          label="File name"
          name={file.name}
          onCancel={onRenameEnd}
          onSubmit={(name) => {
            const error = files.renameFile(file.id, name);
            if (!error) {
              onRenameEnd();
            }
            return error;
          }}
        />
      </li>
    );
  }

  return (
    <li>
      <ContextMenu
        onOpenChangeComplete={(open) => {
          const action = pendingActionRef.current;
          if (!open && action) {
            pendingActionRef.current = null;
            onAction(action);
          }
        }}
      >
        <ContextMenuTrigger
          render={
            <button
              aria-current={isActive ? "page" : undefined}
              className={cn(
                rowClass,
                "focus-visible:ring-wb-accent outline-none focus-visible:ring-1 focus-visible:ring-inset"
              )}
              onClick={() => onAction("open")}
              onKeyDown={(event) => {
                if (event.key === "F2") {
                  event.preventDefault();
                  onAction("rename");
                } else if (event.key === "Delete" && canDelete) {
                  event.preventDefault();
                  onAction("delete");
                }
              }}
              type="button"
            >
              <FileIcon languageId={file.language} />
              <span className="min-w-0 truncate">{file.name}</span>
              <Viewers names={viewers} />
            </button>
          }
        />
        <ContextMenuContent
          className="w-56"
          finalFocus={() => pendingActionRef.current === null}
        >
          <ContextMenuItem
            onClick={() => {
              pendingActionRef.current = "newFile";
            }}
          >
            New File…
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              pendingActionRef.current = "open";
            }}
          >
            Open
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              pendingActionRef.current = "rename";
            }}
          >
            Rename…
            <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              pendingActionRef.current = "download";
            }}
          >
            Download
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            disabled={!canDelete}
            onClick={() => {
              pendingActionRef.current = "delete";
            }}
            variant="destructive"
          >
            Delete
            <ContextMenuShortcut>Delete</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  );
};

// The file list, with a menu for the space around the files. A file's own
// menu stops the right-click from reaching this one.
const ExplorerMenu = ({ children }: { children: ReactNode }) => {
  const { actions, setCreatingFile } = useWorkbench();
  const isCreatingRef = useRef(false);

  return (
    <ContextMenu
      onOpenChangeComplete={(open) => {
        if (!open && isCreatingRef.current) {
          isCreatingRef.current = false;
          setCreatingFile(true);
        }
      }}
    >
      <ContextMenuTrigger
        className="min-h-0 flex-1 overflow-y-auto pb-2"
        onDoubleClick={(event) => {
          // Only the empty space below the files
          if (event.target === event.currentTarget) {
            actions?.newFile();
          }
        }}
        render={<ul aria-label="Files" />}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-56"
        finalFocus={() => !isCreatingRef.current}
      >
        <ContextMenuItem
          disabled={!actions}
          onClick={() => {
            isCreatingRef.current = true;
          }}
        >
          New File…
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!actions}
          onClick={() => actions?.openLocal()}
        >
          Open from Local…
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export const ExplorerView = () => {
  const { files, isCreatingFile, setCreatingFile } = useWorkbench();
  const room = useRoomConnection();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<RoomFile | null>(null);
  const canDelete = files.files.length > 1;

  const viewerPairs = usePresenceSelector(
    (states) => selectViewers(states, room?.clientId ?? -1),
    Object.is
  );
  const getViewers = (fileId: string) =>
    viewerPairs
      .split("\n")
      .filter((pair) => pair.startsWith(`${fileId}:`))
      .map((pair) => pair.slice(fileId.length + 1));

  const runAction = (file: RoomFile, action: RowAction) => {
    if (action === "newFile") {
      setCreatingFile(true);
    } else if (action === "open") {
      files.openFile(file.id);
    } else if (action === "rename") {
      setRenamingId(file.id);
    } else if (action === "download") {
      const text = files.fileModels?.getModel(file.id)?.getValue();
      if (text !== undefined) {
        saveLocal(text, file.name);
      }
    } else if (canDelete) {
      setDeleting(file);
    }
  };

  return (
    <FileDropZone
      className="flex min-h-0 flex-1 flex-col"
      label="Drop files to add them"
    >
      <ExplorerMenu>
        {isCreatingFile && (
          <li className="flex h-[22px] items-center gap-1.5 pr-2 pl-5">
            <FileIcon languageId="plaintext" />
            <NameBox
              className="flex-1"
              label="New file name"
              name=""
              onCancel={() => setCreatingFile(false)}
              onSubmit={(name) => {
                const error = files.createFile(name);
                if (!error) {
                  setCreatingFile(false);
                }
                return error;
              }}
            />
          </li>
        )}
        {files.files.map((file) => (
          <FileRow
            canDelete={canDelete}
            file={file}
            isActive={file.id === files.activeFile?.id}
            isRenaming={file.id === renamingId}
            key={file.id}
            onAction={(action) => runAction(file, action)}
            onRenameEnd={() => setRenamingId(null)}
            viewers={getViewers(file.id)}
          />
        ))}
      </ExplorerMenu>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        open={deleting !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It's deleted for everyone in the room, and can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  files.deleteFile(deleting.id);
                }
                setDeleting(null);
              }}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FileDropZone>
  );
};

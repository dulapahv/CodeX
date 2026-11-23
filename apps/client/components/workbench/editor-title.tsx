/**
 * The row above the code editor: a tab for each file this person has open,
 * and the run controls on the right where VS Code puts its editor actions.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { ExecutionResult } from "@codex/types/terminal";
import { XIcon } from "@phosphor-icons/react";
import {
  type Dispatch,
  type DragEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { RunButton } from "@/components/run-button";
import { useRoomAccess } from "@/lib/realtime/room-context";
import type { RoomFile } from "@/lib/realtime/room-files";
import { cn } from "@/lib/utils";

import { FileIcon } from "./file-icon";
import { NameBox } from "./name-box";
import { useWorkbench } from "./workbench-provider";

const MIDDLE_BUTTON = 1;
// Dragged tabs carry this type, so file drops and other drags pass by
const TAB_DRAG_TYPE = "application/x-codex-tab";

interface FileTabProps {
  // Where a dragged tab would land, at one edge of this one
  dropLine: "left" | "right" | null;
  file: RoomFile;
  isActive: boolean;
  onDragEnd: () => void;
  onDragStart: (id: string) => void;
}

const FileTab = ({
  dropLine,
  file,
  isActive,
  onDragEnd,
  onDragStart,
}: FileTabProps) => {
  const { editor, files, renamingFileId, setRenamingFileId } = useWorkbench();
  const { canEdit } = useRoomAccess();
  const isRenaming = canEdit && renamingFileId === file.id;

  const stopRenaming = () => {
    setRenamingFileId(null);
    editor?.focus();
  };

  return (
    <div
      className={cn(
        "group border-wb-border relative flex h-full shrink-0 items-center gap-1.5 border-r pr-1 pl-3 text-[13px]",
        isActive
          ? "bg-wb-editor text-wb-fg before:bg-wb-accent before:absolute before:inset-x-0 before:top-0 before:h-px"
          : "text-wb-muted hover:text-wb-fg"
      )}
      data-file-id={file.id}
    >
      {dropLine && (
        <span
          aria-hidden="true"
          className={cn(
            "bg-wb-accent absolute inset-y-0 z-10 w-0.5",
            dropLine === "left" ? "-left-px" : "-right-px"
          )}
        />
      )}
      <FileIcon languageId={file.language} />
      {isRenaming ? (
        <NameBox
          className="w-40"
          label="File name"
          name={file.name}
          onCancel={stopRenaming}
          onSubmit={(name) => {
            const error = files.renameFile(file.id, name);
            if (!error) {
              stopRenaming();
            }
            return error;
          }}
        />
      ) : (
        // Stretched over the whole tab, so the icon and padding open it too
        <button
          aria-selected={isActive}
          className="focus-visible:after:ring-wb-accent h-full max-w-48 truncate outline-none after:absolute after:inset-0 focus-visible:after:ring-1 focus-visible:after:ring-inset"
          draggable
          onAuxClick={(event) => {
            if (event.button === MIDDLE_BUTTON) {
              files.closeFile(file.id);
            }
          }}
          onClick={() => files.openFile(file.id)}
          onDoubleClick={() => canEdit && setRenamingFileId(file.id)}
          onDragEnd={onDragEnd}
          onDragStart={(event) => {
            event.dataTransfer.setData(TAB_DRAG_TYPE, file.id);
            event.dataTransfer.effectAllowed = "move";
            onDragStart(file.id);
          }}
          onKeyDown={(event) => {
            if (canEdit && event.key === "F2") {
              event.preventDefault();
              setRenamingFileId(file.id);
            }
          }}
          role="tab"
          title={canEdit ? `${file.name} (double-click to rename)` : file.name}
          type="button"
        >
          {file.name}
        </button>
      )}
      <button
        aria-label={`Close ${file.name}`}
        className={cn(
          "hover:bg-wb-hover focus-visible:ring-wb-accent relative flex size-5 items-center justify-center outline-none focus-visible:opacity-100 focus-visible:ring-1",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={() => files.closeFile(file.id)}
        type="button"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
};

interface EditorTitleProps {
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>;
}

export const EditorTitle = ({ setOutput }: EditorTitleProps) => {
  const { actions, editor, files, monaco, showPanelView } = useWorkbench();
  const { canEdit } = useRoomAccess();
  const tabListRef = useRef<HTMLDivElement>(null);
  const activeId = files.activeFile?.id;
  const openFiles = files.openIds
    .map((id) => files.files.find((file) => file.id === id))
    .filter((file) => file !== undefined);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  // The tab a drop would go in front of, null for the end, or undefined
  // while nothing is over the strip
  const [dropBefore, setDropBefore] = useState<string | null>();

  // In front of the tab under the pointer, or of the one after it once the
  // pointer is past the tab's middle
  const findDropBefore = (event: DragEvent) => {
    const tab =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-file-id]")
        : null;
    const id = tab?.dataset.fileId;
    if (!(tab && id)) {
      return null;
    }
    const { left, width } = tab.getBoundingClientRect();
    if (event.clientX < left + width / 2) {
      return id;
    }
    return files.openIds[files.openIds.indexOf(id) + 1] ?? null;
  };

  const endDrag = () => {
    setDraggedId(null);
    setDropBefore(undefined);
  };

  const getDropLine = (id: string, index: number) => {
    if (!draggedId || dropBefore === undefined) {
      return null;
    }
    if (dropBefore === id) {
      return "left";
    }
    return dropBefore === null && index === openFiles.length - 1
      ? "right"
      : null;
  };

  // Keeps the open file's tab in view as tabs open and the strip resizes
  useEffect(() => {
    const list = tabListRef.current;
    if (!(list && activeId)) {
      return;
    }
    const reveal = () =>
      list
        .querySelector(`[data-file-id="${CSS.escape(activeId)}"]`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const observer = new ResizeObserver(reveal);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeId]);

  return (
    <div className="bg-wb-chrome flex h-9 shrink-0 shadow-[inset_0_-1px_var(--wb-border)]">
      <div
        aria-label="Open files"
        className="flex min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto"
        onDoubleClick={(event) => {
          // Only the empty space after the tabs
          if (canEdit && event.target === event.currentTarget) {
            actions?.newFile();
          }
        }}
        onDragLeave={(event) => {
          if (
            !(
              event.relatedTarget instanceof Node &&
              event.currentTarget.contains(event.relatedTarget)
            )
          ) {
            setDropBefore(undefined);
          }
        }}
        onDragOver={(event) => {
          if (
            !(draggedId && event.dataTransfer.types.includes(TAB_DRAG_TYPE))
          ) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setDropBefore(findDropBefore(event));
        }}
        onDrop={(event) => {
          if (!draggedId) {
            return;
          }
          event.preventDefault();
          const before = findDropBefore(event);
          if (before !== draggedId) {
            files.moveTab(draggedId, before);
          }
          endDrag();
        }}
        ref={tabListRef}
        role="tablist"
      >
        {openFiles.map((file, index) => (
          <FileTab
            dropLine={getDropLine(file.id, index)}
            file={file}
            isActive={file.id === files.activeFile?.id}
            key={file.id}
            onDragEnd={endDrag}
            onDragStart={setDraggedId}
          />
        ))}
      </div>
      {/* The editor loads only once the room has connected, which running needs */}
      {editor && monaco && files.activeFile && (
        <div className="ml-auto flex shrink-0 items-center px-1.5">
          <RunButton
            editor={editor}
            file={files.activeFile}
            monaco={monaco}
            onRun={() => showPanelView("terminal")}
            setOutput={setOutput}
          />
        </div>
      )}
    </div>
  );
};

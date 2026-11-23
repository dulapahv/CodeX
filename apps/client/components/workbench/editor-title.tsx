/**
 * The row above the code editor: a tab for each file this person has open,
 * and the run controls on the right where VS Code puts its editor actions.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { ExecutionResult } from "@codex/types/terminal";
import { XIcon } from "@phosphor-icons/react";
import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";

import { RunButton } from "@/components/run-button";
import type { RoomFile } from "@/lib/realtime/room-files";
import { cn } from "@/lib/utils";

import { FileIcon } from "./file-icon";
import { NameBox } from "./name-box";
import { useWorkbench } from "./workbench-provider";

const MIDDLE_BUTTON = 1;

interface FileTabProps {
  file: RoomFile;
  isActive: boolean;
}

const FileTab = ({ file, isActive }: FileTabProps) => {
  const { editor, files, renamingFileId, setRenamingFileId } = useWorkbench();
  const isRenaming = renamingFileId === file.id;

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
          onAuxClick={(event) => {
            if (event.button === MIDDLE_BUTTON) {
              files.closeFile(file.id);
            }
          }}
          onClick={() => files.openFile(file.id)}
          onDoubleClick={() => setRenamingFileId(file.id)}
          onKeyDown={(event) => {
            if (event.key === "F2") {
              event.preventDefault();
              setRenamingFileId(file.id);
            }
          }}
          role="tab"
          title={`${file.name} (double-click to rename)`}
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
  const tabListRef = useRef<HTMLDivElement>(null);
  const activeId = files.activeFile?.id;
  const openFiles = files.openIds
    .map((id) => files.files.find((file) => file.id === id))
    .filter((file) => file !== undefined);

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
          if (event.target === event.currentTarget) {
            actions?.newFile();
          }
        }}
        ref={tabListRef}
        role="tablist"
      >
        {openFiles.map((file) => (
          <FileTab
            file={file}
            isActive={file.id === files.activeFile?.id}
            key={file.id}
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

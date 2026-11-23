/**
 * The collaborative notepad, a Lexical rich text editor bound to the room's
 * shared document, with a markdown source view.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { useEffect, useRef, useState } from "react";

import { useRoomAccess } from "@/lib/realtime/room-context";
import { cn } from "@/lib/utils";

import { NotepadExtension } from "../extension";
import { CodeActionMenuPlugin } from "../plugins/code-action-menu-plugin";
import { CollaborationPlugin } from "../plugins/collaboration-plugin";
import { DraggableBlockPlugin } from "../plugins/draggable-block-plugin";
import { FloatingLinkEditorPlugin } from "../plugins/floating-link-editor-plugin";
import { FloatingTextFormatPlugin } from "../plugins/floating-text-format-plugin";
import { InsertDialogsPlugin } from "../plugins/insert-dialogs-plugin";
import { SlashMenuPlugin } from "../plugins/slash-menu-plugin";
import { SourceEditorPlugin } from "../plugins/source-editor-plugin";
import { TableActionMenuPlugin } from "../plugins/table-action-menu-plugin";
import { ToolbarPlugin } from "../plugins/toolbar-plugin";
import { SaveNoteBtn } from "./save-note-btn";

const PLACEHOLDER =
  "Everyone who can edit the room can edit this note. Type / to insert a block.";
const VIEWER_PLACEHOLDER = "Nothing has been written here yet.";

const EditablePlugin = ({ isEditable }: { isEditable: boolean }) => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => editor.setEditable(isEditable), [editor, isEditable]);
  return null;
};

// Viewers can still save the note to their computer
const ViewerToolbar = () => (
  <div
    aria-label="Notepad"
    className="flex min-h-fit items-center gap-0.5 bg-[color:var(--toolbar-bg-secondary)] p-1 text-[color:var(--toolbar-foreground)]"
    role="toolbar"
  >
    <span className="text-muted-foreground px-1.5 text-xs">View only</span>
    <div className="ml-auto flex items-center gap-0.5">
      <SaveNoteBtn />
    </div>
  </div>
);

const NotepadMain = () => {
  // The room ignores a viewer's changes, so the note is read-only for them
  const { canEdit } = useRoomAccess();
  const placeholder = canEdit ? PLACEHOLDER : VIEWER_PLACEHOLDER;
  const cursorsContainerRef = useRef<HTMLDivElement>(null);
  const [anchorElem, setAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);

  return (
    <LexicalExtensionComposer
      contentEditable={null}
      extension={NotepadExtension}
    >
      <EditablePlugin isEditable={canEdit} />
      <div className="notepad text-foreground flex size-full flex-col">
        {canEdit ? (
          <ToolbarPlugin
            isSourceMode={isSourceMode}
            onToggleSourceMode={() => setIsSourceMode((value) => !value)}
            setIsLinkEditMode={setIsLinkEditMode}
          />
        ) : (
          <ViewerToolbar />
        )}
        <div className="relative min-h-0 flex-1">
          <div
            className={cn(
              "absolute inset-0 flex flex-col overflow-auto",
              isSourceMode && canEdit && "invisible"
            )}
          >
            <div className="relative flex-1" ref={setAnchorElem}>
              <ContentEditable
                aria-label="Shared note"
                aria-placeholder={placeholder}
                className="notepad-content min-h-full py-3 pr-4 pl-10 outline-none"
                placeholder={
                  <div className="text-muted-foreground pointer-events-none absolute top-3 right-4 left-10 text-base leading-7 select-none">
                    {placeholder}
                  </div>
                }
              />
              <div ref={cursorsContainerRef} />
            </div>
          </div>
          {isSourceMode && canEdit && <SourceEditorPlugin />}
        </div>
        <CollaborationPlugin cursorsContainerRef={cursorsContainerRef} />
        {canEdit && anchorElem && (
          <InsertDialogsPlugin anchorElem={anchorElem} />
        )}
        {canEdit && <SlashMenuPlugin />}
        {canEdit && anchorElem && !isSourceMode && (
          <>
            <FloatingTextFormatPlugin
              anchorElem={anchorElem}
              setIsLinkEditMode={setIsLinkEditMode}
            />
            <FloatingLinkEditorPlugin
              anchorElem={anchorElem}
              isLinkEditMode={isLinkEditMode}
              setIsLinkEditMode={setIsLinkEditMode}
            />
            <CodeActionMenuPlugin anchorElem={anchorElem} />
            <TableActionMenuPlugin anchorElem={anchorElem} />
            <DraggableBlockPlugin anchorElem={anchorElem} />
          </>
        )}
      </div>
    </LexicalExtensionComposer>
  );
};

export { NotepadMain };

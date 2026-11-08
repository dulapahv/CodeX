/**
 * The collaborative notepad, a Lexical rich text editor bound to the room's
 * shared document, with a markdown source view.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { useRef, useState } from "react";

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

const PLACEHOLDER =
  "All participants can edit this note. Type / to insert a block.";

const NotepadMain = () => {
  const cursorsContainerRef = useRef<HTMLDivElement>(null);
  const [anchorElem, setAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);

  return (
    <LexicalExtensionComposer
      contentEditable={null}
      extension={NotepadExtension}
    >
      <div className="notepad text-foreground flex size-full flex-col bg-[color:var(--panel-background)]">
        <ToolbarPlugin
          isSourceMode={isSourceMode}
          onToggleSourceMode={() => setIsSourceMode((value) => !value)}
          setIsLinkEditMode={setIsLinkEditMode}
        />
        <div className="relative min-h-0 flex-1">
          <div
            className={cn(
              "absolute inset-0 flex flex-col overflow-auto",
              isSourceMode && "invisible"
            )}
          >
            <div className="relative flex-1" ref={setAnchorElem}>
              <ContentEditable
                aria-label="Shared note"
                aria-placeholder={PLACEHOLDER}
                className="notepad-content min-h-full py-3 pr-4 pl-10 outline-none"
                placeholder={
                  <div className="text-muted-foreground pointer-events-none absolute top-3 left-10 text-base leading-7 select-none">
                    {PLACEHOLDER}
                  </div>
                }
              />
              <div ref={cursorsContainerRef} />
            </div>
          </div>
          {isSourceMode && <SourceEditorPlugin />}
        </div>
        <CollaborationPlugin cursorsContainerRef={cursorsContainerRef} />
        {anchorElem && <InsertDialogsPlugin anchorElem={anchorElem} />}
        <SlashMenuPlugin />
        {anchorElem && !isSourceMode && (
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

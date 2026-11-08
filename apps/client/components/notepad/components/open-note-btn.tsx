/**
 * Opens a markdown file into the shared note, replacing it for everyone.
 * Once a file is picked, it asks first if the note has anything in it.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $convertFromMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FolderIcon } from "@phosphor-icons/react";
import { $getRoot, $isParagraphNode } from "lexical";
import { useState } from "react";

import { ReplacePromptDialog } from "@/components/replace-prompt-dialog";

import { NOTEPAD_TRANSFORMERS } from "../markdown";
import { ToolbarButton } from "./toolbar-button";

const NOTE_FILE_TYPES = ".md,.mdx,.markdown,.txt,text/*";

const $isNoteEmpty = () => {
  const root = $getRoot();
  const first = root.getFirstChild();
  return (
    root.getChildrenSize() <= 1 &&
    (!first || ($isParagraphNode(first) && first.isEmpty()))
  );
};

const OpenNoteBtn = () => {
  const [editor] = useLexicalComposerContext();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const openFile = async (file: File) => {
    const markdown = await file.text();
    editor.update(() =>
      $convertFromMarkdownString(markdown, NOTEPAD_TRANSFORMERS)
    );
  };

  const pickNote = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = NOTE_FILE_TYPES;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      if (editor.getEditorState().read($isNoteEmpty)) {
        openFile(file);
        return;
      }
      setPendingFile(file);
      setIsPromptOpen(true);
    };
    input.click();
  };

  return (
    <>
      <ToolbarButton label="Open note" onClick={pickNote}>
        <FolderIcon />
      </ToolbarButton>
      <ReplacePromptDialog
        confirmLabel="Replace note"
        description="This replaces the note for everyone in the room. Save the current note first if you want to keep it."
        onCancel={() => setIsPromptOpen(false)}
        onConfirm={() => {
          setIsPromptOpen(false);
          if (pendingFile) {
            openFile(pendingFile);
          }
        }}
        open={isPromptOpen}
        title={`Replace the note with ${pendingFile?.name ?? "this file"}?`}
      />
    </>
  );
};

export { OpenNoteBtn };

/**
 * Downloads the note as a timestamped markdown file.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DownloadSimpleIcon } from "@phosphor-icons/react";

import { NOTEPAD_TRANSFORMERS } from "../markdown";
import { ToolbarButton } from "./toolbar-button";

const FILENAME_UNSAFE_CHARACTERS = /[/:, ]/gu;

const SaveNoteBtn = () => {
  const [editor] = useLexicalComposerContext();

  const saveNote = () => {
    const markdown = editor
      .getEditorState()
      .read(() => $convertToMarkdownString(NOTEPAD_TRANSFORMERS));
    const url = URL.createObjectURL(
      new Blob([markdown], { type: "text/markdown" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `codex-note-${new Date()
      .toLocaleString("en-GB")
      .replace(FILENAME_UNSAFE_CHARACTERS, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolbarButton label="Save note" onClick={saveNote}>
      <DownloadSimpleIcon />
    </ToolbarButton>
  );
};

export { SaveNoteBtn };

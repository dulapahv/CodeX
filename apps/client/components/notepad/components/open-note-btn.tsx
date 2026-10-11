/**
 * Open note button component that handles markdown file loading.
 * Features:
 * - File input handling
 * - Markdown content reading
 * - Socket-based sync
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ROOM_DOC } from "@codex/types/realtime";
import { ButtonWithTooltip, type MDXEditorMethods } from "@mdxeditor/editor";
import { Folder } from "lucide-react";
import type { RefObject } from "react";

import { useRoom } from "@/lib/realtime/room-context";

import { replaceText } from "../utils";

interface MarkdownEditorProps {
  markdownEditorRef: RefObject<MDXEditorMethods | null>;
}

const OpenNoteBtn = ({ markdownEditorRef }: MarkdownEditorProps) => {
  const room = useRoom();

  return (
    <ButtonWithTooltip
      aria-label="Open note"
      className="!flex !size-7 !items-center !justify-center [&>span]:flex [&>span]:w-fit"
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".md,.mdx,text/*";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const markdown = reader.result as string;
            markdownEditorRef.current?.setMarkdown(markdown);
            replaceText(room.doc.getText(ROOM_DOC.notes), markdown);
          };
          reader.readAsText(file);
        };
        input.click();
      }}
      title="Open note"
    >
      <Folder className="size-[18px]" />
    </ButtonWithTooltip>
  );
};

export { OpenNoteBtn };

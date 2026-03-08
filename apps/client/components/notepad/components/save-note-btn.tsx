/**
 * Save note button component that handles markdown file download.
 * Features:
 * - Markdown content export
 * - Timestamped filenames
 * - Blob handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ButtonWithTooltip, type MDXEditorMethods } from "@mdxeditor/editor";
import { Download } from "lucide-react";
import type { RefObject } from "react";

interface MarkdownEditorProps {
  markdownEditorRef: RefObject<MDXEditorMethods | null>;
}

const SaveNoteBtn = ({ markdownEditorRef }: MarkdownEditorProps) => (
  <ButtonWithTooltip
    aria-label="Save note"
    className="!ml-0 !flex !size-7 !items-center !justify-center [&>span]:flex [&>span]:w-fit"
    onClick={() => {
      const markdown = markdownEditorRef.current?.getMarkdown() ?? "";
      const blob = new Blob([markdown], {
        type: "text/markdown",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codex-note-${new Date().toLocaleString("en-GB").replace(/[/:, ]/g, "-")}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }}
    title="Save note"
  >
    <Download className="size-[18px]" />
  </ButtonWithTooltip>
);

export { SaveNoteBtn };

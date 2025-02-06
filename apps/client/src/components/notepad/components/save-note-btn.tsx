/**
 * Save note button component that handles markdown file download.
 * Features:
 * - Markdown content export
 * - Timestamped filenames
 * - Blob handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { RefObject } from 'react';

import { ButtonWithTooltip, type MDXEditorMethods } from '@mdxeditor/editor';
import { Download } from 'lucide-react';

interface MarkdownEditorProps {
  markdownEditorRef: RefObject<MDXEditorMethods | null>;
}

const SaveNoteBtn = ({ markdownEditorRef }: MarkdownEditorProps) => (
  <ButtonWithTooltip
    title="Save note"
    aria-label="Save note"
    onClick={() => {
      const markdown = markdownEditorRef.current?.getMarkdown() ?? '';
      const blob = new Blob([markdown], {
        type: 'text/markdown',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codex-note-${new Date().toLocaleString('en-GB').replace(/[/:, ]/g, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }}
    className="!ml-0 !flex !size-7 !items-center !justify-center [&>span]:flex [&>span]:w-fit"
  >
    <Download className="size-[18px]" />
  </ButtonWithTooltip>
);

export { SaveNoteBtn };

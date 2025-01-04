import type { RefObject } from 'react';

import { ButtonWithTooltip, type MDXEditorMethods } from '@mdxeditor/editor';
import { Save } from 'lucide-react';

interface MarkdownEditorProps {
  markdownEditorRef: RefObject<MDXEditorMethods | null>;
}

const SaveNoteBtn = ({ markdownEditorRef }: MarkdownEditorProps) => (
  <ButtonWithTooltip
    title="Save Note"
    onClick={() => {
      const markdown = markdownEditorRef.current?.getMarkdown() ?? '';
      const blob = new Blob([markdown], {
        type: 'text/markdown',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kasca-note-${new Date().toLocaleString('en-GB').replace(/[/:, ]/g, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }}
    className="!ml-0 !flex !size-7 !items-center !justify-center [&>span]:flex [&>span]:w-fit"
  >
    <Save className="size-5" />
  </ButtonWithTooltip>
);

export { SaveNoteBtn };

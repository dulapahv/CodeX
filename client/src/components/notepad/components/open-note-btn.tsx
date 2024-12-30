import type { RefObject } from 'react';
import { ButtonWithTooltip, type MDXEditorMethods } from '@mdxeditor/editor';
import { FileInput } from 'lucide-react';

import { RoomServiceMsg } from '@common/types/message';

import { getSocket } from '@/lib/socket';

interface MarkdownEditorProps {
  markdownEditorRef: RefObject<MDXEditorMethods | null>;
}

const OpenNoteBtn = ({ markdownEditorRef }: MarkdownEditorProps) => {
  const socket = getSocket();

  return (
    <ButtonWithTooltip
      title="Open Note"
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.mdx,text/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const markdown = reader.result as string;
            markdownEditorRef.current?.setMarkdown(markdown);
            socket.emit(RoomServiceMsg.UPDATE_MD, markdown);
          };
          reader.readAsText(file);
        };
        input.click();
      }}
      className="!flex !size-7 !items-center !justify-center [&>span]:flex [&>span]:w-fit"
    >
      <FileInput className="size-5" />
    </ButtonWithTooltip>
  );
};

export { OpenNoteBtn };

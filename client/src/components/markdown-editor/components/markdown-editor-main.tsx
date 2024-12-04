'use client';

import { useEffect, useRef } from 'react';
import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ButtonWithTooltip,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeToggle,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  directivesPlugin,
  headingsPlugin,
  imagePlugin,
  InsertAdmonition,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  StrikeThroughSupSubToggles,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import { FileUp, Save } from 'lucide-react';
import { useTheme } from 'next-themes';

import { RoomServiceMsg } from '@common/types/message';

import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

import '@mdxeditor/editor/style.css';

interface MarkdownEditorProps {
  markdown: string;
}

const MarkdownEditorMain = ({ markdown }: MarkdownEditorProps) => {
  const { resolvedTheme } = useTheme();
  const socket = getSocket();

  const markdownEditorRef = useRef<MDXEditorMethods>(null);

  useEffect(() => {
    socket.on(RoomServiceMsg.UPDATE_MD, (value: string) => {
      markdownEditorRef.current?.setMarkdown(value);
    });

    return () => {
      socket.off(RoomServiceMsg.UPDATE_MD);
    };
  }, [socket]);

  const onChange = (value: string) => {
    socket.emit(RoomServiceMsg.UPDATE_MD, value);
  };

  return (
    <MDXEditor
      ref={markdownEditorRef}
      onChange={onChange}
      markdown={markdown}
      autoFocus={false}
      trim={false}
      placeholder="All participants can edit this note..."
      className={cn(
        'flex w-full flex-col !bg-[color:var(--panel-background)] !font-sans [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div>div>div]:h-full [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div>div]:h-full [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div]:h-full [&:not(.mdxeditor-popup-container)>*:nth-child(2)]:h-full [&>*:nth-child(2)]:overflow-auto [&>div>div[role="dialog"]]:!bg-[color:var(--toolbar-bg-secondary)] [&>div>div]:!ml-0 [&>div[role="dialog"]]:!bg-[color:var(--toolbar-bg-secondary)] [&>div[role="toolbar"]]:!bg-[color:var(--toolbar-bg-secondary)] first:[&>div]:flex first:[&>div]:min-h-fit first:[&>div]:flex-wrap first:[&>div]:!rounded-none',
        resolvedTheme === 'dark' && '!dark-editor !dark-theme',
      )}
      contentEditableClassName={cn(
        `prose h-full max-w-none dark:prose-invert
        first:prose-headings:mt-0
        prose-h1:text-3xl prose-h1:font-extrabold prose-h1:my-6
        prose-h2:text-2xl prose-h2:my-4
        prose-h3:text-xl prose-h3:my-2
        prose-h4:text-lg prose-h4:my-0
        prose-h5:text-base prose-h5:my-0
        prose-h6:text-base prose-h6:my-0
        prose-p:leading-7
        prose-blockquote:border-l-4 prose-blockquote:border-foreground/30 prose-blockquote:italic
        prose-code:text-base prose-code:font-normal before:prose-code:content-none after:prose-code:content-none [&>span]:prose-code:!font-mono [&>span]:prose-code:rounded [&>span]:prose-code:border [&>span]:prose-code:border-foreground/40 [&>span]:prose-code:bg-foreground/20 [&>span]:prose-code:px-1.5 [&>span]:prose-code:py-0.5
        prose-pre:bg-muted prose-pre:rounded-lg
        prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-a:transition-opacity
        prose-em:italic prose-em:text-foreground/90
        prose-li:!no-underline before:prose-li:!top-1/2
        before:prose-li:-translate-y-1/2 after:prose-li:!top-1/2
        after:prose-li:!-translate-y-1/2 after:prose-li:rotate-45
        prose-hr:border-foreground/30
        prose-img:rounded-lg
        `,
      )}
      plugins={[
        listsPlugin(),
        quotePlugin(),
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        tablePlugin(),
        thematicBreakPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
        markdownShortcutPlugin(),
        directivesPlugin({
          directiveDescriptors: [AdmonitionDirectiveDescriptor],
        }),
        diffSourcePlugin({
          diffMarkdown: markdown,
          viewMode: 'rich-text',
        }),
        imagePlugin(),
        // https://codemirror.net/5/mode/
        codeMirrorPlugin({
          codeBlockLanguages: {
            '': 'Plain Text',
            c: 'C',
            cpp: 'C++',
            cs: 'C#',
            css: 'CSS',
            go: 'GO',
            html: 'HTML',
            java: 'Java',
            js: 'JavaScript',
            json: 'JSON',
            jsx: 'JSX',
            md: 'Markdown',
            php: 'PHP',
            py: 'Python',
            rs: 'Rust',
            sh: 'Shell',
            ts: 'TypeScript',
            tsx: 'TSX',
            yaml: 'YAML',
          },
          autoLoadLanguageSupport: true,
        }),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <ButtonWithTooltip
                title="Save Markdown"
                onClick={() => {
                  const markdown =
                    markdownEditorRef.current?.getMarkdown() ?? '';
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
                className="!flex !size-7 !items-center !justify-center [&>span]:flex [&>span]:w-fit"
              >
                <Save className="size-5" />
              </ButtonWithTooltip>
              <ButtonWithTooltip
                title="Open Markdown"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.md,text/*';
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
                <FileUp className="size-5" />
              </ButtonWithTooltip>
              <Separator />
              <UndoRedo />
              <Separator />
              <BoldItalicUnderlineToggles />
              <CodeToggle />
              <Separator />
              <StrikeThroughSupSubToggles />
              <Separator />
              <ListsToggle />
              <Separator />
              <BlockTypeSelect />
              <Separator />
              <CreateLink />
              <InsertImage />
              <Separator />
              <InsertTable />
              <InsertThematicBreak />
              <Separator />
              <InsertCodeBlock />
              <InsertAdmonition />
              <Separator />
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
    />
  );
};

export { MarkdownEditorMain };

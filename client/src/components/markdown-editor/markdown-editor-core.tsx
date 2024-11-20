'use client';

import { useEffect, useRef } from 'react';
import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeToggle,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  directivesPlugin,
  headingsPlugin,
  InsertAdmonition,
  InsertCodeBlock,
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
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { useTheme } from 'next-themes';

import { RoomServiceMsg } from '@common/types/message';

import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

import '@mdxeditor/editor/style.css';

interface MarkdownEditorProps {
  markdown: string;
}

const MarkdownEditorCore = ({ markdown }: MarkdownEditorProps) => {
  const { resolvedTheme } = useTheme();
  const socket = getSocket();

  const markdownEditorRef = useRef<MDXEditorMethods>(null);

  useEffect(() => {
    socket.on(RoomServiceMsg.MD_RX, (value: string) => {
      markdownEditorRef.current?.setMarkdown(value);
    });

    return () => {
      socket.off(RoomServiceMsg.MD_RX);
    };
  }, [socket]);

  const onChange = (value: string) => {
    socket.emit(RoomServiceMsg.MD_TX, value);
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
        'flex w-full flex-col !bg-[color:var(--panel-background)] [&>*:nth-child(2)>div>div>div]:h-full [&>*:nth-child(2)>div>div]:h-full [&>*:nth-child(2)>div]:h-full [&>*:nth-child(2)]:h-full [&>*:nth-child(2)]:overflow-auto last:[&>div>div]:!ml-0 first:[&>div]:flex first:[&>div]:min-h-fit first:[&>div]:flex-wrap first:[&>div]:rounded-none first:[&>div]:!bg-[color:var(--toolbar-bg-secondary)]',
        resolvedTheme === 'dark' && '!dark-editor !dark-theme',
      )}
      contentEditableClassName={cn(
        GeistSans.className,
        `h-full max-w-none prose dark:prose-invert prose-li:!no-underline after:prose-li:!top-[8.5px] before:prose-li:!top-1/2 before:prose-li:-translate-y-1/2 before:prose-code:content-none after:prose-code:content-none [&>span]:prose-code:rounded [&>span]:prose-code:border [&>span]:prose-code:border-foreground/40 [&>span]:prose-code:bg-foreground/20 prose-code:font-normal prose-code:text-base`,
        `[&>span]:${GeistMono.className}`,
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
        // https://codemirror.net/5/mode/
        codeMirrorPlugin({
          codeBlockLanguages: {
            js: 'JavaScript',
            jsx: 'JSX',
            ts: 'TypeScript',
            tsx: 'TSX',
            css: 'CSS',
            go: 'GO',
            html: 'HTML',
            java: 'Java',
            json: 'JSON',
            liquid: 'Liquid',
            md: 'Markdown',
            php: 'PHP',
            py: 'Python',
            rs: 'Rust',
            scss: 'Sass',
            xml: 'XML',
            yaml: 'YAML',
            '': 'Plain Text',
          },
        }),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <DiffSourceToggleWrapper>
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
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
                <InsertAdmonition />
                <Separator />
              </DiffSourceToggleWrapper>
            </>
          ),
        }),
      ]}
    />
  );
};

export { MarkdownEditorCore };

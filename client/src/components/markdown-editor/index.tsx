'use client';

import { useEffect, useRef } from 'react';
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeToggle,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
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

const MarkdownEditor = ({ markdown }: MarkdownEditorProps) => {
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
      placeholder="All participants can see this note..."
      className={cn(
        'flex w-full flex-col !bg-background [&>*:nth-child(2)>div>div>div]:h-full [&>*:nth-child(2)>div>div]:h-full [&>*:nth-child(2)>div]:h-full [&>*:nth-child(2)]:size-full [&>*:nth-child(2)]:overflow-auto last:[&>div>div]:!ml-0 first:[&>div]:flex first:[&>div]:min-h-fit first:[&>div]:flex-wrap first:[&>div]:rounded-none first:[&>div]:border-b-[1px] first:[&>div]:bg-accent',
        resolvedTheme === 'dark' && 'dark-theme dark-editor',
      )}
      contentEditableClassName={cn(
        GeistSans.className,
        'h-full max-w-none prose dark:prose-invert before:prose-code:content-none after:prose-code:content-none [&>span]:prose-code:rounded [&>span]:prose-code:bg-foreground/20',
        `[&>span]:${GeistMono.className}`,
      )}
      plugins={[
        diffSourcePlugin(),
        listsPlugin(),
        quotePlugin(),
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin(),
        tablePlugin(),
        thematicBreakPlugin(),
        frontmatterPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
        markdownShortcutPlugin(),
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
                <Separator />
              </DiffSourceToggleWrapper>
            </>
          ),
        }),
      ]}
    />
  );
};

export { MarkdownEditor };

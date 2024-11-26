'use client';

import { useEffect, useRef } from 'react';
import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  Button,
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
        'flex w-full flex-col !bg-[color:var(--panel-background)] [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div>div>div]:h-full [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div>div]:h-full [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div]:h-full [&:not(.mdxeditor-popup-container)>*:nth-child(2)]:h-full [&>*:nth-child(2)]:overflow-auto [&>div>div[role="dialog"]]:!bg-[color:var(--toolbar-bg-secondary)] [&>div>div]:!ml-0 [&>div[role="dialog"]]:!bg-[color:var(--toolbar-bg-secondary)] [&>div[role="toolbar"]]:!bg-[color:var(--toolbar-bg-secondary)] first:[&>div]:flex first:[&>div]:min-h-fit first:[&>div]:flex-wrap first:[&>div]:!rounded-none',
        resolvedTheme === 'dark' && '!dark-editor !dark-theme',
      )}
      contentEditableClassName={cn(
        GeistSans.className,
        `prose h-full max-w-none dark:prose-invert prose-code:text-base prose-code:font-normal before:prose-code:content-none after:prose-code:content-none prose-li:!no-underline before:prose-li:!top-1/2 before:prose-li:-translate-y-1/2 after:prose-li:!top-1/2 after:prose-li:!-translate-y-1/2 after:prose-li:rotate-45 [&>span]:prose-code:rounded [&>span]:prose-code:border [&>span]:prose-code:border-foreground/40 [&>span]:prose-code:bg-foreground/20`,
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
                <InsertImage />
                <Separator />
                <InsertTable />
                <InsertThematicBreak />
                <Separator />
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

/**
 * Main notepad component that provides collaborative Markdown editing.
 * Features:
 * - Real-time collaborative editing
 * - Rich text formatting tools
 * - Markdown syntax support
 * - Image and table insertion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { useTheme } from 'next-themes';

import { RoomServiceMsg } from '@codex/types/message';

import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

import { codeBlockLanguages } from '../constants';
import { OpenNoteBtn } from './open-note-btn';
import { SaveNoteBtn } from './save-note-btn';

import '@mdxeditor/editor/style.css';
import '@radix-ui/colors/mauve-dark.css';

interface MarkdownEditorProps {
  markdown: string;
}

const MarkdownEditorMain = ({ markdown }: MarkdownEditorProps) => {
  const { resolvedTheme } = useTheme();
  const socket = getSocket();

  const [key, setKey] = useState(0);

  const markdownEditorRef = useRef<MDXEditorMethods>(null);
  const contentRef = useRef(markdown);

  const plugins = useMemo(
    () => [
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
      codeMirrorPlugin({
        codeMirrorExtensions: [
          resolvedTheme === 'dark' ? githubDark : githubLight,
        ],
        codeBlockLanguages,
        autoLoadLanguageSupport: true,
      }),
      toolbarPlugin({
        toolbarContents: () => (
          <DiffSourceToggleWrapper options={['rich-text', 'source']}>
            <OpenNoteBtn markdownEditorRef={markdownEditorRef} />
            <SaveNoteBtn markdownEditorRef={markdownEditorRef} />
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
    ],
    [resolvedTheme, markdown],
  );

  useEffect(() => {
    socket.on(RoomServiceMsg.UPDATE_MD, (value: string) => {
      contentRef.current = value;
      markdownEditorRef.current?.setMarkdown(value);
    });

    return () => {
      socket.off(RoomServiceMsg.UPDATE_MD);
    };
  }, [socket]);

  useEffect(() => {
    const editor = markdownEditorRef.current;
    if (editor) {
      contentRef.current = editor.getMarkdown();
      setKey((prev) => prev + 1);
    }
  }, [resolvedTheme]);

  const onChange = (value: string) => {
    contentRef.current = value;
    socket.emit(RoomServiceMsg.UPDATE_MD, value);
  };

  return (
    <MDXEditor
      key={key}
      ref={markdownEditorRef}
      onChange={onChange}
      markdown={contentRef.current}
      autoFocus={false}
      trim={false}
      placeholder="All participants can edit this note..."
      plugins={plugins}
      className={cn(
        `flex w-full flex-col !bg-[color:var(--panel-background)] !font-sans
        [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div>div>div]:h-full
        [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div>div]:h-full
        [&:not(.mdxeditor-popup-container)>*:nth-child(2)>div]:h-full
        [&:not(.mdxeditor-popup-container)>*:nth-child(2)]:h-full
        [&>*:nth-child(2)]:overflow-auto
        [&>div>div[role="dialog"]]:!bg-[color:var(--toolbar-bg-secondary)]
        [&>div>div]:!ml-0 [&>div[role="dialog"]]:!bg-[color:var(--toolbar-bg-secondary)]
        [&>div[role="toolbar"]]:!bg-[color:var(--toolbar-bg-secondary)]
        first:[&>div]:flex first:[&>div]:min-h-fit first:[&>div]:flex-wrap
        first:[&>div]:!rounded-none`,
        resolvedTheme === 'dark' && '!dark-editor !dark-theme',
      )}
      contentEditableClassName={cn(
        `prose h-full max-w-none dark:prose-invert
        first:prose-headings:mt-0
        prose-h1:text-3xl prose-h1:font-extrabold prose-h1:my-2
        prose-h2:text-2xl prose-h2:my-2
        prose-h3:text-xl prose-h3:my-2
        prose-h4:text-lg prose-h4:my-0
        prose-h5:text-base prose-h5:my-0
        prose-h6:text-base prose-h6:my-0
        prose-p:leading-7 prose-p:my-1
        prose-img:rounded prose-img:my-0
        prose-blockquote:border-foreground/30 prose-blockquote:my-0 prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-foreground/50
        prose-code:text-base prose-code:font-normal before:prose-code:content-none after:prose-code:content-none [&>span]:prose-code:!font-mono [&>span]:prose-code:rounded [&>span]:prose-code:border [&>span]:prose-code:border-foreground/40 [&>span]:prose-code:bg-foreground/20 [&>span]:prose-code:px-1 [&>span]:prose-code:py-px
        prose-pre:bg-muted prose-pre:rounded-lg
        prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-a:transition-opacity
        prose-em:italic prose-em:text-foreground/90
        prose-ul:my-0
        prose-ol:my-0
        prose-li:!no-underline prose-li:!my-0 before:prose-li:-translate-y-1/2 before:prose-li:!top-1/2 after:prose-li:!-translate-y-1/2 after:prose-li:!top-1/2 after:prose-li:rotate-45
        prose-hr:border-foreground/30 prose-hr:my-4
        prose-table:my-0
        prose-th:!py-0
        prose-td:!py-0 prose-td:align-middle`,
      )}
    />
  );
};

export { MarkdownEditorMain };

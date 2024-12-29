'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { EditorSkeleton } from './components/editor-skeleton';

const DynamicMarkdownMain = dynamic(
  () =>
    import('./components/markdown-editor-main').then(
      (mod) => mod.MarkdownEditorMain,
    ),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

const Notepad = ({ markdown }: { markdown: string }) => (
  <Suspense fallback={null}>
    <DynamicMarkdownMain markdown={markdown} />
  </Suspense>
);

export { Notepad };

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { EditorSkeleton } from './components/editor-skeleton';

const DynamicNotepadMain = dynamic(
  () =>
    import('./components/notepad-main').then((mod) => mod.MarkdownEditorMain),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

const Notepad = ({ markdown }: { markdown: string }) => (
  <Suspense fallback={null}>
    <DynamicNotepadMain markdown={markdown} />
  </Suspense>
);

export { Notepad };

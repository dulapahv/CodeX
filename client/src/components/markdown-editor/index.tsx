'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const DynamicMarkdownEditor = dynamic(
  () => import('./markdown-editor-core').then((mod) => mod.MarkdownEditorCore),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

const EditorSkeleton = () => (
  <div className="size-full bg-[color:var(--panel-background)]" />
);

export const MarkdownEditor = ({ markdown }: { markdown: string }) => {
  return (
    <Suspense fallback={null}>
      <DynamicMarkdownEditor markdown={markdown} />
    </Suspense>
  );
};

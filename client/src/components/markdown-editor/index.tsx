'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Create a loading placeholder component
const EditorSkeleton = () => (
  <div className="h-[300px] w-full animate-pulse rounded-md bg-muted" />
);

// Dynamic import the actual editor component
const DynamicMarkdownEditor = dynamic(
  () => import('./markdown-editor-core').then((mod) => mod.MarkdownEditorCore),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

export const MarkdownEditor = ({ markdown }: { markdown: string }) => {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <DynamicMarkdownEditor markdown={markdown} />
    </Suspense>
  );
};

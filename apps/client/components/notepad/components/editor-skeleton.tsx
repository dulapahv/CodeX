/**
 * Loading skeleton component for the code editor.
 * Features:
 * - Simulated toolbar interface
 * - Animated content placeholders
 * - Responsive layout matching editor
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Skeleton } from '@/components/ui/skeleton';

const EditorSkeleton = () => (
  <div className="flex size-full flex-col bg-[color:var(--panel-background)]">
    {/* Top toolbar skeleton */}
    <div className="flex items-center justify-between bg-[color:var(--toolbar-bg-secondary)] p-2">
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
      </div>
    </div>

    {/* Editor content skeleton */}
    <div className="flex-1 space-y-3 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </div>
);

export { EditorSkeleton };

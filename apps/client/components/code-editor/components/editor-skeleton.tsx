/**
 * Placeholder code lines shown while Monaco loads.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const LINES = [
  "w-1/3",
  "ml-6 w-1/2",
  "ml-6 w-2/5",
  "ml-12 w-1/4",
  "ml-6 w-3/5",
  "w-1/5",
] as const;

export const CodeEditorSkeleton = () => (
  <div className="flex size-full flex-col gap-3 bg-[color:var(--panel-background)] py-3 pr-4 pl-16">
    {LINES.map((line) => (
      <Skeleton className={cn("h-4", line)} key={line} />
    ))}
  </div>
);

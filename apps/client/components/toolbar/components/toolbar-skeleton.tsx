/**
 * Placeholder toolbar shown while the editor loads.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Skeleton } from "@/components/ui/skeleton";

const MENU_WIDTHS = {
  file: "w-6",
  edit: "w-7",
  selection: "w-14",
  view: "w-8",
  help: "w-8",
} as const;
const ACTION_KEYS = ["follow", "settings", "leave"] as const;

export const ToolbarSkeleton = () => (
  <div
    aria-hidden="true"
    className="flex h-full items-center justify-between gap-x-2 bg-[color:var(--toolbar-bg-secondary)] px-2"
  >
    <div className="flex items-center gap-4">
      {Object.entries(MENU_WIDTHS).map(([menu, width]) => (
        <Skeleton className={`h-3.5 ${width}`} key={menu} />
      ))}
    </div>
    <Skeleton className="h-7 w-32" />
    <div className="flex items-center gap-2">
      <Skeleton className="size-7 rounded-full" />
      <Skeleton className="h-7 w-16" />
      {ACTION_KEYS.map((key) => (
        <Skeleton className="size-7" key={key} />
      ))}
    </div>
  </div>
);

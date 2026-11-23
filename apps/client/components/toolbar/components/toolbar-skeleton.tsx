/**
 * Placeholder menus shown while the editor loads.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Skeleton } from "@/components/ui/skeleton";

const MENU_WIDTHS = {
  code: "w-8",
  edit: "w-7",
  file: "w-6",
  go: "w-5",
  help: "w-8",
  selection: "w-14",
  view: "w-8",
} as const;

export const ToolbarSkeleton = () => (
  <div aria-hidden="true" className="flex items-center gap-4 px-2">
    {Object.entries(MENU_WIDTHS).map(([menu, width]) => (
      <Skeleton className={`bg-wb-hover h-3 ${width}`} key={menu} />
    ))}
  </div>
);

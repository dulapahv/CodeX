/**
 * Tree view for browsing repositories, branches and folders. Each folder
 * opens on its own, built on shadcn's Collapsible like its file tree example.
 *
 * Modified by Dulapah Vibulsanti (https://github.com/dulapahv) from a comment
 * on an issue in shadcn-ui/ui by WangLarry (https://github.com/WangLarry).
 * Reference: https://github.com/shadcn-ui/ui/issues/355#issuecomment-1703767574
 */

"use client";

import {
  CaretRightIcon,
  FolderIcon as DefaultFolderIcon,
  FileCodeIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { type HTMLAttributes, useState } from "react";
import { itemType } from "@/components/repo-browser/types/tree";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface TreeDataItem {
  children?: TreeDataItem[];
  icon?: PhosphorIcon;
  id: string;
  isLoading?: boolean;
  name: string;
  type?: string;
}

interface TreeProps extends HTMLAttributes<HTMLDivElement> {
  data: TreeDataItem[] | TreeDataItem;
  initialSelectedItemId?: string;
  onSelectChange?: (item: TreeDataItem) => void;
}

// The highlight spans the whole row, whatever the nesting depth
const ROW_CLASS =
  "flex w-full cursor-pointer items-center px-2 py-2 text-left outline-none before:absolute before:left-1 before:-z-10 before:h-[1.75rem] before:w-[calc(100%-8px)] before:bg-secondary before:opacity-0 hover:before:opacity-50 focus-visible:before:opacity-50";
const SELECTED_ROW_CLASS =
  "text-accent-foreground before:border-l-4 before:border-l-accent-foreground/50 before:bg-accent before:opacity-50";
const ICON_CLASS = "mr-2 size-4 shrink-0 text-accent-foreground/50";

const FOLDER_TYPES = new Set<string>([
  itemType.REPO,
  itemType.BRANCH,
  itemType.DIR,
]);

const isFolder = (item: TreeDataItem) =>
  Boolean(item.children) || FOLDER_TYPES.has(item.type ?? "");

interface TreeNodesProps {
  expandedIds: Set<string>;
  items: TreeDataItem[];
  onSelect: (item: TreeDataItem) => void;
  onToggle: (itemId: string) => void;
  selectedItemId?: string;
}

const TreeNodes = ({
  expandedIds,
  items,
  onSelect,
  onToggle,
  selectedItemId,
}: TreeNodesProps) => (
  <ul>
    {items.map((item) => {
      const Icon =
        item.icon ?? (isFolder(item) ? DefaultFolderIcon : FileCodeIcon);
      const rowClass = cn(
        ROW_CLASS,
        selectedItemId === item.id && SELECTED_ROW_CLASS
      );
      const label = (
        <>
          <Icon aria-hidden="true" className={ICON_CLASS} />
          <span className={cn("truncate text-sm", !isFolder(item) && "grow")}>
            {item.name}
          </span>
        </>
      );

      if (!isFolder(item)) {
        return (
          <li key={item.id}>
            <button
              className={rowClass}
              onClick={() => onSelect(item)}
              type="button"
            >
              {label}
            </button>
          </li>
        );
      }

      return (
        <li key={item.id}>
          <Collapsible
            onOpenChange={() => onToggle(item.id)}
            open={expandedIds.has(item.id)}
          >
            <CollapsibleTrigger
              className={cn(
                rowClass,
                "[&[data-panel-open]>svg]:last:rotate-90"
              )}
              onClick={() => onSelect(item)}
            >
              {label}
              {item.isLoading && <Spinner className="ml-2" />}
              <CaretRightIcon
                aria-hidden="true"
                className="text-accent-foreground/50 ml-auto size-4 shrink-0 transition-transform duration-200"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-foreground/10 ml-4 h-(--collapsible-panel-height) overflow-hidden border-l pl-2 text-sm transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0">
              {item.children && (
                <div className="pb-1">
                  <TreeNodes
                    expandedIds={expandedIds}
                    items={item.children}
                    onSelect={onSelect}
                    onToggle={onToggle}
                    selectedItemId={selectedItemId}
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </li>
      );
    })}
  </ul>
);

const Tree = ({
  className,
  data,
  initialSelectedItemId,
  onSelectChange,
  ...props
}: TreeProps) => {
  const [selectedItemId, setSelectedItemId] = useState(initialSelectedItemId);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const handleSelect = (item: TreeDataItem) => {
    setSelectedItemId(item.id);
    onSelectChange?.(item);
  };

  const handleToggle = (itemId: string) =>
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });

  return (
    <div className={cn("overflow-auto", className)} {...props}>
      <div className="relative p-2">
        <TreeNodes
          expandedIds={expandedIds}
          items={Array.isArray(data) ? data : [data]}
          onSelect={handleSelect}
          onToggle={handleToggle}
          selectedItemId={selectedItemId}
        />
      </div>
    </div>
  );
};

export { Tree, type TreeDataItem };

/**
 * Tree view component for displaying hierarchical data.
 * Features:
 * - Item expansion/collapse
 * - Item selection
 * - Loading states
 * - Scrollable interface
 *
 * Modified by Dulapah Vibulsanti (https://github.com/dulapahv) from a comment
 * on an issue in shadcn-ui/ui by WangLarry (https://github.com/WangLarry).
 * Reference: https://github.com/shadcn-ui/ui/issues/355#issuecomment-1703767574
 */

"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronRight, FileCode, Folder, type LucideIcon } from "lucide-react";
import { forwardRef, type HTMLAttributes, useCallback, useState } from "react";
import { itemType } from "@/components/repo-browser/types/tree";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// Base interface for tree items
interface TreeDataItem {
  children?: TreeDataItem[];
  icon?: LucideIcon;
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

const Tree = forwardRef<HTMLDivElement, TreeProps>(
  (
    { data, initialSelectedItemId, onSelectChange, className, ...props },
    ref
  ) => {
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
      initialSelectedItemId
    );
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const handleSelectChange = useCallback(
      (item: TreeDataItem) => {
        setSelectedItemId(item.id);
        if (onSelectChange) {
          onSelectChange(item);
        }
      },
      [onSelectChange]
    );

    const handleExpand = useCallback((itemId: string) => {
      setExpandedIds((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((id) => id !== itemId);
        }
        return [...prev, itemId];
      });
    }, []);

    return (
      <div className={cn("overflow-auto", className)}>
        <div className="relative p-2">
          <TreeItem
            data={data}
            expandedIds={expandedIds}
            FolderIcon={Folder}
            handleSelectChange={handleSelectChange}
            ItemIcon={FileCode}
            onExpand={handleExpand}
            ref={ref}
            selectedItemId={selectedItemId}
            {...props}
          />
        </div>
      </div>
    );
  }
);
Tree.displayName = "Tree";

type TreeItemProps = TreeProps & {
  selectedItemId?: string;
  handleSelectChange: (item: TreeDataItem) => void;
  expandedIds: string[];
  onExpand: (itemId: string) => void;
  FolderIcon?: LucideIcon;
  ItemIcon?: LucideIcon;
};

const TreeItem = forwardRef<HTMLDivElement, TreeItemProps>(
  (
    {
      className,
      data,
      selectedItemId,
      handleSelectChange,
      expandedIds,
      onExpand,
      FolderIcon,
      ItemIcon,
      ...props
    },
    ref
  ) => {
    return (
      <div className={className} ref={ref} role="tree" {...props}>
        <ul>
          {Array.isArray(data) ? (
            data.map((item) => (
              <li key={item.id}>
                {item.children ||
                item.type === itemType.REPO ||
                item.type === itemType.BRANCH ||
                item.type === itemType.DIR ? (
                  <AccordionPrimitive.Root
                    multiple
                    onValueChange={() => {
                      onExpand(item.id);
                    }}
                    value={expandedIds}
                  >
                    <AccordionPrimitive.Item value={item.id}>
                      <AccordionTrigger
                        className={cn(
                          "px-2 before:absolute before:left-1 before:-z-10 before:h-[1.75rem] before:w-[calc(100%-8px)] before:bg-secondary before:opacity-0 hover:before:opacity-50",
                          selectedItemId === item.id &&
                            "text-accent-foreground before:border-l-4 before:border-l-accent-foreground/50 before:bg-accent before:opacity-50"
                        )}
                        onClick={() => handleSelectChange(item)}
                      >
                        {item.icon && (
                          <item.icon
                            aria-hidden="true"
                            className="mr-2 size-4 shrink-0 text-accent-foreground/50"
                          />
                        )}
                        {!item.icon && FolderIcon && (
                          <FolderIcon
                            aria-hidden="true"
                            className="mr-2 size-4 shrink-0 text-accent-foreground/50"
                          />
                        )}
                        <span className="truncate text-sm">{item.name}</span>
                        {item.isLoading && <Spinner className="ml-2" />}
                      </AccordionTrigger>
                      <AccordionContent className="ml-4 pl-2">
                        {item.children && (
                          <TreeItem
                            data={item.children}
                            expandedIds={expandedIds}
                            FolderIcon={FolderIcon}
                            handleSelectChange={handleSelectChange}
                            ItemIcon={ItemIcon}
                            onExpand={onExpand}
                            selectedItemId={selectedItemId}
                          />
                        )}
                      </AccordionContent>
                    </AccordionPrimitive.Item>
                  </AccordionPrimitive.Root>
                ) : (
                  <Leaf
                    Icon={ItemIcon}
                    isSelected={selectedItemId === item.id}
                    item={item}
                    onClick={() => handleSelectChange(item)}
                  />
                )}
              </li>
            ))
          ) : (
            <li>
              <Leaf
                Icon={ItemIcon}
                isSelected={selectedItemId === data.id}
                item={data}
                onClick={() => handleSelectChange(data)}
              />
            </li>
          )}
        </ul>
      </div>
    );
  }
);
TreeItem.displayName = "TreeItem";

const Leaf = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    item: TreeDataItem;
    isSelected?: boolean;
    Icon?: LucideIcon;
  }
>(({ className, item, isSelected, Icon, ...props }, ref) => (
  <div
    className={cn(
      "flex cursor-pointer items-center px-2 py-2 before:absolute before:right-1 before:left-1 before:-z-10 before:h-[1.75rem] before:w-[calc(100%-8px)] before:bg-secondary before:opacity-0 hover:before:opacity-50",
      className,
      isSelected &&
        "text-accent-foreground before:border-l-4 before:border-l-accent-foreground/50 before:bg-accent before:opacity-50"
    )}
    ref={ref}
    {...props}
  >
    {item.icon && (
      <item.icon
        aria-hidden="true"
        className="mr-2 size-4 shrink-0 text-accent-foreground/50"
      />
    )}
    {!item.icon && Icon && (
      <Icon
        aria-hidden="true"
        className="mr-2 size-4 shrink-0 text-accent-foreground/50"
      />
    )}
    <span className="flex-grow truncate text-sm">{item.name}</span>
  </div>
));
Leaf.displayName = "Leaf";

const AccordionTrigger = ({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) => (
  <AccordionPrimitive.Header>
    <AccordionPrimitive.Trigger
      className={cn(
        "flex w-full flex-1 items-center py-2 [&[data-panel-open]>svg]:last:rotate-90",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-4 shrink-0 text-accent-foreground/50 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

const AccordionContent = ({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) => (
  <AccordionPrimitive.Panel
    className={cn(
      "left-3 overflow-hidden border-foreground/10 border-l text-sm transition-all data-closed:animate-accordion-up data-open:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className="pt-0 pb-1">{children}</div>
  </AccordionPrimitive.Panel>
);

export { Tree, type TreeDataItem };

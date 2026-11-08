/**
 * Wraps a block that isn't text (a drawing, an embed, a poll) with an outline
 * while it is selected and buttons that show on hover.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { TrashIcon } from "@phosphor-icons/react";
import { $getNodeByKey, type NodeKey } from "lexical";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ToolbarButton } from "./toolbar-button";

interface BlockFrameProps {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  nodeKey: NodeKey;
}

const BlockFrame = ({
  actions,
  children,
  className,
  nodeKey,
}: BlockFrameProps) => {
  const [editor] = useLexicalComposerContext();
  const [isSelected] = useLexicalNodeSelection(nodeKey);

  const remove = () =>
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove();
    });

  return (
    <div
      className={cn(
        "group/block relative my-2",
        isSelected && "outline-primary outline-2 outline-offset-2",
        className
      )}
    >
      {children}
      <div className="bg-popover/90 text-popover-foreground ring-foreground/10 absolute top-1 right-1 hidden items-center gap-0.5 p-0.5 shadow-sm ring-1 group-hover/block:flex">
        {actions}
        <ToolbarButton className="size-6" label="Remove" onClick={remove}>
          <TrashIcon />
        </ToolbarButton>
      </div>
    </div>
  );
};

export { BlockFrame };

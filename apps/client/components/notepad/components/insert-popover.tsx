/**
 * A small form for the notepad that opens from whatever asked for it, so the
 * eye stays where the user just was. That's the toolbar button they clicked,
 * the caret when they typed a slash command, or the block they're editing.
 * On narrow screens it slides up from the bottom instead.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createDOMRange } from "@lexical/selection";
import {
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import { type ReactNode, useId } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

import { restoreEditorFocus } from "../utils";

const DESKTOP_QUERY = "(min-width: 768px)";
const POPUP_SELECTOR =
  '[data-slot="popover-content"], [data-slot="drawer-popup"]';

// Where the popover points. A toolbar button is measured on the page, and
// anything in the note relative to its scrolling content so it scrolls along
export interface PopoverAnchor {
  height: number;
  isOnPage: boolean;
  left: number;
  top: number;
  width: number;
}

const toolbarOrigins = new WeakMap<LexicalEditor, HTMLElement>();

// Runs a toolbar action so any popover it opens hangs off that button
export const openFromToolbar = (
  editor: LexicalEditor,
  origin: HTMLElement | null,
  open: () => void
) => {
  if (origin) {
    toolbarOrigins.set(editor, origin);
  }
  try {
    open();
  } finally {
    toolbarOrigins.delete(editor);
  }
};

export const getToolbarOrigin = (editor: LexicalEditor) =>
  toolbarOrigins.get(editor);

const getSelectionRect = (editor: LexicalEditor) =>
  editor.read(() => {
    const selection = $getSelection();
    if ($isNodeSelection(selection)) {
      const [node] = selection.getNodes();
      return node
        ? (editor.getElementByKey(node.getKey())?.getBoundingClientRect() ??
            null)
        : null;
    }
    if (!$isRangeSelection(selection)) {
      return null;
    }
    const [start, end] = selection.isBackward()
      ? [selection.focus, selection.anchor]
      : [selection.anchor, selection.focus];
    const rect = createDOMRange(
      editor,
      start.getNode(),
      start.offset,
      end.getNode(),
      end.offset
    )?.getBoundingClientRect();
    if (rect && rect.height > 0) {
      return rect;
    }
    // An empty line has no text to measure, so point at its block
    return (
      editor
        .getElementByKey(start.getNode().getKey())
        ?.getBoundingClientRect() ?? null
    );
  });

interface AnchorSource {
  nodeKey?: NodeKey;
  origin?: HTMLElement;
}

export const getPopoverAnchor = (
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  { nodeKey, origin }: AnchorSource
): PopoverAnchor => {
  if (origin?.isConnected) {
    const { height, left, top, width } = origin.getBoundingClientRect();
    return { height, isOnPage: true, left, top, width };
  }
  const rect = nodeKey
    ? editor.getElementByKey(nodeKey)?.getBoundingClientRect()
    : getSelectionRect(editor);
  // With nothing to point at, it opens at the top of the note
  if (!rect) {
    return { height: 0, isOnPage: false, left: 0, top: 0, width: 0 };
  }
  const content = anchorElem.getBoundingClientRect();
  return {
    height: rect.height,
    isOnPage: false,
    left: rect.left - content.left,
    top: rect.top - content.top,
    width: nodeKey ? rect.width : 1,
  };
};

interface InsertPopoverProps {
  anchor: PopoverAnchor | null;
  anchorElem: HTMLElement;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
}

export const InsertPopover = ({
  anchor,
  anchorElem,
  children,
  className,
  description,
  onClose,
  open,
  title,
}: InsertPopoverProps) => {
  const [editor] = useLexicalComposerContext();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const anchorId = useId();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  // A click into the note or another panel keeps the focus it moved there
  const finalFocus = () => {
    const active = document.activeElement;
    const hasMovedAway =
      active instanceof HTMLElement &&
      active !== document.body &&
      !active.closest(POPUP_SELECTOR);
    if (!hasMovedAway) {
      restoreEditorFocus(editor);
    }
    return false;
  };

  if (!isDesktop) {
    return (
      <Drawer onOpenChange={handleOpenChange} open={open}>
        <DrawerContent finalFocus={finalFocus}>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="p-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover onOpenChange={handleOpenChange} open={open} triggerId={anchorId}>
      {anchor &&
        createPortal(
          <PopoverTrigger
            aria-hidden="true"
            className={cn(
              "pointer-events-none",
              anchor.isOnPage ? "fixed" : "absolute"
            )}
            id={anchorId}
            nativeButton={false}
            render={<span />}
            style={{
              height: anchor.height,
              left: anchor.left,
              top: anchor.top,
              width: anchor.width,
            }}
            tabIndex={-1}
          />,
          anchor.isOnPage ? document.body : anchorElem
        )}
      <PopoverContent
        align="start"
        className={cn("w-80", className)}
        finalFocus={finalFocus}
      >
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          {description && (
            <PopoverDescription>{description}</PopoverDescription>
          )}
        </PopoverHeader>
        {children}
      </PopoverContent>
    </Popover>
  );
};

interface InsertPopoverActionsProps {
  canSubmit: boolean;
  onCancel: () => void;
  submitLabel: string;
}

export const InsertPopoverActions = ({
  canSubmit,
  onCancel,
  submitLabel,
}: InsertPopoverActionsProps) => (
  <div className="flex justify-end gap-2">
    <Button onClick={onCancel} size="sm" type="button" variant="ghost">
      Cancel
    </Button>
    <Button disabled={!canSubmit} size="sm" type="submit">
      {submitLabel}
    </Button>
  </div>
);

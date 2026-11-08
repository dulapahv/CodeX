/**
 * A menu button in the table cell holding the caret, for adding and
 * removing rows and columns or the whole table.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableSelection,
} from "@lexical/table";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  CaretDownIcon,
  ColumnsPlusLeftIcon,
  ColumnsPlusRightIcon,
  RowsPlusBottomIcon,
  RowsPlusTopIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  type NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { restoreEditorFocus } from "../utils";

const MENU_INSET = 2;

interface CellTarget {
  key: NodeKey;
  left: number;
  top: number;
}

const isSameTarget = (previous: CellTarget | null, next: CellTarget | null) =>
  previous?.key === next?.key &&
  previous?.left === next?.left &&
  previous?.top === next?.top;

interface TableActionMenuPluginProps {
  anchorElem: HTMLElement;
}

const TableActionMenuPlugin = ({ anchorElem }: TableActionMenuPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const [target, setTarget] = useState<CellTarget | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const updateTarget = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const anchorNode =
        $isRangeSelection(selection) || $isTableSelection(selection)
          ? selection.anchor.getNode()
          : null;
      const cell = anchorNode
        ? $findMatchingParent(anchorNode, $isTableCellNode)
        : null;
      const element = cell ? editor.getElementByKey(cell.getKey()) : null;
      if (!(cell && element)) {
        setTarget(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const next = {
        key: cell.getKey(),
        left: rect.right - anchorRect.left - MENU_INSET,
        top: rect.top - anchorRect.top + MENU_INSET,
      };
      setTarget((previous) => (isSameTarget(previous, next) ? previous : next));
    });
  }, [anchorElem, editor]);

  useEffect(() => {
    window.addEventListener("resize", updateTarget);
    anchorElem.addEventListener("scroll", updateTarget, true);
    const unregister = mergeRegister(
      editor.registerUpdateListener(updateTarget),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateTarget();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
    return () => {
      unregister();
      window.removeEventListener("resize", updateTarget);
      anchorElem.removeEventListener("scroll", updateTarget, true);
    };
  }, [anchorElem, editor, updateTarget]);

  if (!(target || isOpen)) {
    return null;
  }

  const run = (action: () => void) => () => editor.update(action);

  const deleteTable = () => {
    if (!target) {
      return;
    }
    const cell = $getNodeByKey(target.key);
    if ($isTableCellNode(cell)) {
      $getTableNodeFromLexicalNodeOrThrow(cell).remove();
    }
  };

  return createPortal(
    <div
      className="absolute z-10 -translate-x-full"
      style={{ left: target?.left, top: target?.top }}
    >
      <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Table options"
              className="bg-popover/90 text-foreground/70 hover:bg-foreground/10 size-5"
              size="icon-xs"
              variant="ghost"
            >
              <CaretDownIcon />
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          className="w-48"
          finalFocus={() => restoreEditorFocus(editor)}
        >
          <DropdownMenuItem
            onClick={run(() => $insertTableRowAtSelection(false))}
          >
            <RowsPlusTopIcon />
            Insert row above
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={run(() => $insertTableRowAtSelection(true))}
          >
            <RowsPlusBottomIcon />
            Insert row below
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={run(() => $insertTableColumnAtSelection(false))}
          >
            <ColumnsPlusLeftIcon />
            Insert column left
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={run(() => $insertTableColumnAtSelection(true))}
          >
            <ColumnsPlusRightIcon />
            Insert column right
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={run($deleteTableRowAtSelection)}>
            <TrashIcon />
            Delete row
          </DropdownMenuItem>
          <DropdownMenuItem onClick={run($deleteTableColumnAtSelection)}>
            <TrashIcon />
            Delete column
          </DropdownMenuItem>
          <DropdownMenuItem onClick={run(deleteTable)} variant="destructive">
            <TrashIcon />
            Delete table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>,
    anchorElem
  );
};

export { TableActionMenuPlugin };

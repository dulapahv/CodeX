/**
 * A handle beside the hovered block for dragging it elsewhere in the note,
 * with a button that adds a block below through the slash menu.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { DotsSixVerticalIcon, PlusIcon } from "@phosphor-icons/react";
import {
  $createParagraphNode,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $isParagraphNode,
} from "lexical";
import { useRef, useState } from "react";

const MENU_CLASS_NAME = "notepad-block-menu";

const isOnMenu = (element: HTMLElement) =>
  element.closest(`.${MENU_CLASS_NAME}`) !== null;

interface DraggableBlockPluginProps {
  anchorElem: HTMLElement;
}

const DraggableBlockPlugin = ({ anchorElem }: DraggableBlockPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [blockElement, setBlockElement] = useState<HTMLElement | null>(null);

  const addBlockBelow = () => {
    if (!blockElement) {
      return;
    }
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(blockElement);
      if (!node) {
        return;
      }
      if ($isParagraphNode(node) && node.isEmpty()) {
        node.append($createTextNode("/"));
        node.selectEnd();
        return;
      }
      const paragraph = $createParagraphNode().append($createTextNode("/"));
      node.insertAfter(paragraph);
      paragraph.selectEnd();
    });
    editor.focus();
  };

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      isOnMenu={isOnMenu}
      menuComponent={
        <div
          className={`${MENU_CLASS_NAME} text-foreground/40 absolute top-0 left-0 flex items-center opacity-0 transition-opacity will-change-transform`}
          ref={menuRef}
        >
          <button
            aria-label="Add block below"
            className="hover:bg-foreground/10 hover:text-foreground flex size-5 items-center justify-center"
            onClick={addBlockBelow}
            title="Add block below"
            type="button"
          >
            <PlusIcon className="size-3.5" />
          </button>
          <div
            aria-hidden="true"
            className="hover:bg-foreground/10 hover:text-foreground flex size-5 cursor-grab items-center justify-center active:cursor-grabbing"
            title="Drag to move"
          >
            <DotsSixVerticalIcon className="size-4" />
          </div>
        </div>
      }
      menuRef={menuRef}
      onElementChanged={setBlockElement}
      targetLineComponent={
        <div
          className="bg-primary pointer-events-none absolute top-0 left-0 h-0.5 opacity-0 will-change-transform"
          ref={targetLineRef}
        />
      }
      targetLineRef={targetLineRef}
    />
  );
};

export { DraggableBlockPlugin };

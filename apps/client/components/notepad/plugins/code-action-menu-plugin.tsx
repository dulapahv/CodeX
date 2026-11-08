/**
 * A language picker and copy button pinned to the corner of the code block
 * under the pointer or the caret.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $isCodeNode, CodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  type NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ToolbarButton } from "../components/toolbar-button";
import { CODE_LANGUAGES, getLanguageKey, PLAIN_TEXT } from "../languages";
import { restoreEditorFocus } from "../utils";

const COPIED_RESET_MS = 1500;
const MENU_INSET = 2;
const LANGUAGE_ITEMS = Object.entries(CODE_LANGUAGES).map(([value, label]) => ({
  label,
  value,
}));

interface CodeTarget {
  key: NodeKey;
  language: string;
  right: number;
  top: number;
}

const isSameTarget = (previous: CodeTarget | null, next: CodeTarget) =>
  previous?.key === next.key &&
  previous.language === next.language &&
  previous.right === next.right &&
  previous.top === next.top;

interface CodeActionMenuPluginProps {
  anchorElem: HTMLElement;
}

const CodeActionMenuPlugin = ({ anchorElem }: CodeActionMenuPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const [target, setTarget] = useState<CodeTarget | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const hoveredKeyRef = useRef<NodeKey | null>(null);
  const isMenuOpenRef = useRef(false);

  const updateTarget = useCallback(() => {
    if (isMenuOpenRef.current) {
      return;
    }
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const caretCode = $isRangeSelection(selection)
        ? $findMatchingParent(selection.anchor.getNode(), $isCodeNode)
        : null;
      const hovered = hoveredKeyRef.current
        ? $getNodeByKey(hoveredKeyRef.current)
        : null;
      const code = $isCodeNode(hovered) ? hovered : caretCode;
      const element = code ? editor.getElementByKey(code.getKey()) : null;
      if (!(code && element)) {
        setTarget(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const next = {
        key: code.getKey(),
        language: getLanguageKey(code.getLanguage()),
        right: anchorRect.right - rect.right + MENU_INSET,
        top: rect.top - anchorRect.top + MENU_INSET,
      };
      setTarget((previous) => (isSameTarget(previous, next) ? previous : next));
    });
  }, [anchorElem, editor]);

  useEffect(() => {
    const scroller = anchorElem.parentElement;
    const onMouseMove = (event: MouseEvent) => {
      const element =
        event.target instanceof Element
          ? event.target.closest("[data-code-menu], code")
          : null;
      if (element?.hasAttribute("data-code-menu")) {
        return;
      }
      const key = element
        ? editor
            .getEditorState()
            .read(() => $getNearestNodeFromDOMNode(element)?.getKey() ?? null, {
              editor,
            })
        : null;
      if (key !== hoveredKeyRef.current) {
        hoveredKeyRef.current = key;
        updateTarget();
      }
    };
    const onMouseLeave = () => {
      hoveredKeyRef.current = null;
      updateTarget();
    };
    scroller?.addEventListener("mousemove", onMouseMove);
    scroller?.addEventListener("mouseleave", onMouseLeave);

    const unregister = mergeRegister(
      editor.registerMutationListener(CodeNode, updateTarget, {
        skipInitialization: true,
      }),
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
      scroller?.removeEventListener("mousemove", onMouseMove);
      scroller?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [anchorElem, editor, updateTarget]);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(timeout);
  }, [isCopied]);

  if (!target) {
    return null;
  }

  const setLanguage = (language: string | null) => {
    editor.update(() => {
      const node = $getNodeByKey(target.key);
      if ($isCodeNode(node)) {
        node.setLanguage(
          !language || language === PLAIN_TEXT ? undefined : language
        );
      }
    });
  };

  const copyCode = async () => {
    const code = editor
      .getEditorState()
      .read(() => $getNodeByKey(target.key)?.getTextContent() ?? "");
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
  };

  return createPortal(
    <div
      className="absolute z-10 flex items-center gap-1"
      data-code-menu
      style={{ right: target.right, top: target.top }}
    >
      <Select
        items={LANGUAGE_ITEMS}
        onOpenChange={(open) => {
          isMenuOpenRef.current = open;
        }}
        onValueChange={setLanguage}
        value={target.language}
      >
        <SelectTrigger
          aria-label="Code language"
          className="bg-popover/90 px-2 py-0 text-[11px] data-[size=sm]:h-6 [&_svg:not([class*='size-'])]:size-3.5"
          size="sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          className="max-h-72"
          finalFocus={() => restoreEditorFocus(editor)}
        >
          {LANGUAGE_ITEMS.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ToolbarButton
        className="bg-popover/90 size-6"
        label={isCopied ? "Copied" : "Copy code"}
        onClick={copyCode}
      >
        {isCopied ? <CheckIcon /> : <CopyIcon />}
      </ToolbarButton>
    </div>,
    anchorElem
  );
};

export { CodeActionMenuPlugin };

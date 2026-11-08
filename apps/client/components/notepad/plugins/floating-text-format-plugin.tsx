/**
 * A small formatting bar that follows a text selection, for quick bold,
 * italic, code, highlight and link changes without reaching for the
 * toolbar.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $isCodeHighlightNode, $isCodeNode } from "@lexical/code";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  CodeIcon,
  HighlighterIcon,
  LinkIcon,
  TextBIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from "@phosphor-icons/react";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  getDOMSelection,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  type TextFormatType,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ToolbarButton } from "../components/toolbar-button";
import {
  EMPTY_LINK_URL,
  getSelectedNode,
  sanitizeUrl,
  setFloatingElemPosition,
} from "../utils";

const LINE_BREAKS = /\n/gu;

const FORMATS = [
  { format: "bold", icon: TextBIcon, label: "Bold" },
  { format: "italic", icon: TextItalicIcon, label: "Italic" },
  { format: "underline", icon: TextUnderlineIcon, label: "Underline" },
  {
    format: "strikethrough",
    icon: TextStrikethroughIcon,
    label: "Strikethrough",
  },
  { format: "code", icon: CodeIcon, label: "Inline code" },
  { format: "highlight", icon: HighlighterIcon, label: "Highlight" },
] as const satisfies { format: TextFormatType; icon: unknown; label: string }[];

type Format = (typeof FORMATS)[number]["format"];

interface SelectionFormat {
  formats: Record<Format, boolean>;
  isLink: boolean;
}

interface FloatingTextFormatToolbarProps extends SelectionFormat {
  anchorElem: HTMLElement;
  editor: LexicalEditor;
  setIsLinkEditMode: (isLinkEditMode: boolean) => void;
}

const FloatingTextFormatToolbar = ({
  anchorElem,
  editor,
  formats,
  isLink,
  setIsLinkEditMode,
}: FloatingTextFormatToolbarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  const $updatePosition = useCallback(() => {
    const toolbar = toolbarRef.current;
    const nativeSelection = getDOMSelection(editor._window);
    const rootElement = editor.getRootElement();
    if (
      !toolbar ||
      $getSelection() === null ||
      !nativeSelection ||
      nativeSelection.isCollapsed ||
      nativeSelection.rangeCount === 0 ||
      !rootElement?.contains(nativeSelection.anchorNode)
    ) {
      return;
    }
    setFloatingElemPosition(
      nativeSelection.getRangeAt(0).getBoundingClientRect(),
      toolbar,
      anchorElem
    );
  }, [anchorElem, editor]);

  // Let a drag selection pass under the bar instead of catching on it
  useEffect(() => {
    const setPointerEvents = (value: string) => {
      if (toolbarRef.current) {
        toolbarRef.current.style.pointerEvents = value;
      }
    };
    const onMouseMove = (event: MouseEvent) => {
      if (event.buttons === 1 || event.buttons === 3) {
        setPointerEvents("none");
      }
    };
    const onMouseUp = () => setPointerEvents("auto");
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    const scroller = anchorElem.parentElement;
    const update = () => editor.getEditorState().read($updatePosition);
    update();
    window.addEventListener("resize", update);
    scroller?.addEventListener("scroll", update);
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) =>
        editorState.read($updatePosition)
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updatePosition();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
    return () => {
      unregister();
      window.removeEventListener("resize", update);
      scroller?.removeEventListener("scroll", update);
    };
  }, [anchorElem, editor, $updatePosition]);

  const toggleLink = () => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    setIsLinkEditMode(true);
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(EMPTY_LINK_URL));
  };

  return (
    <div
      aria-label="Selection formatting"
      className="bg-popover text-popover-foreground ring-foreground/10 absolute top-0 left-0 z-20 flex items-center gap-0.5 p-1 opacity-0 shadow-md ring-1 transition-opacity will-change-transform"
      ref={toolbarRef}
      role="toolbar"
    >
      {FORMATS.map(({ format, icon: FormatIcon, label }) => (
        <ToolbarButton
          key={format}
          label={label}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
          pressed={formats[format]}
        >
          <FormatIcon />
        </ToolbarButton>
      ))}
      <ToolbarButton
        label={isLink ? "Remove link" : "Link"}
        onClick={toggleLink}
        pressed={isLink}
      >
        <LinkIcon />
      </ToolbarButton>
    </div>
  );
};

const NO_FORMATS: Record<Format, boolean> = {
  bold: false,
  code: false,
  highlight: false,
  italic: false,
  strikethrough: false,
  underline: false,
};

interface FloatingTextFormatPluginProps {
  anchorElem: HTMLElement;
  setIsLinkEditMode: (isLinkEditMode: boolean) => void;
}

const FloatingTextFormatPlugin = ({
  anchorElem,
  setIsLinkEditMode,
}: FloatingTextFormatPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const [format, setFormat] = useState<SelectionFormat | null>(null);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = getDOMSelection(editor._window);
      const rootElement = editor.getRootElement();
      const isInEditor =
        nativeSelection !== null &&
        rootElement?.contains(nativeSelection.anchorNode) === true;

      if (
        !($isRangeSelection(selection) && isInEditor) ||
        selection.isCollapsed() ||
        selection.getTextContent().replace(LINE_BREAKS, "") === ""
      ) {
        setFormat(null);
        return;
      }

      const node = getSelectedNode(selection);
      const anchorNode = selection.anchor.getNode();
      if (
        $isCodeHighlightNode(anchorNode) ||
        $findMatchingParent(anchorNode, $isCodeNode) ||
        !selection.getNodes().some($isTextNode)
      ) {
        setFormat(null);
        return;
      }

      const formats = { ...NO_FORMATS };
      for (const { format: name } of FORMATS) {
        formats[name] = selection.hasFormat(name);
      }
      setFormat({
        formats,
        isLink: $isLinkNode(node) || $isLinkNode(node.getParent()),
      });
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener("selectionchange", updatePopup);
    return () => document.removeEventListener("selectionchange", updatePopup);
  }, [updatePopup]);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(updatePopup),
        editor.registerRootListener(() => {
          if (editor.getRootElement() === null) {
            setFormat(null);
          }
        })
      ),
    [editor, updatePopup]
  );

  if (!format) {
    return null;
  }

  return createPortal(
    <FloatingTextFormatToolbar
      anchorElem={anchorElem}
      editor={editor}
      formats={format.formats}
      isLink={format.isLink}
      setIsLinkEditMode={setIsLinkEditMode}
    />,
    anchorElem
  );
};

export { FloatingTextFormatPlugin };

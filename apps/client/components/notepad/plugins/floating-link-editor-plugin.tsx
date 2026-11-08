/**
 * Shows the link under the caret with buttons to open, edit or remove it,
 * and an address field while a link is being added or edited.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  $createLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  ArrowSquareOutIcon,
  CheckIcon,
  LinkBreakIcon,
  PencilSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  getDOMSelection,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Input } from "@/components/ui/input";

import { ToolbarButton } from "../components/toolbar-button";
import {
  EMPTY_LINK_URL,
  getSelectedNode,
  restoreEditorFocus,
  sanitizeUrl,
  setFloatingElemPosition,
  validateUrl,
} from "../utils";

const $getLinkAtSelection = () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }
  return $findMatchingParent(getSelectedNode(selection), $isLinkNode);
};

// A caret in an empty line has no box of its own, so use its line instead
const getSelectionRect = (selection: Selection) => {
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  if (rect.width || rect.height) {
    return rect;
  }
  const node = selection.focusNode;
  const element = node instanceof Element ? node : node?.parentElement;
  return element?.getBoundingClientRect() ?? rect;
};

const isSavableUrl = (url: string) =>
  url !== EMPTY_LINK_URL && validateUrl(url);

interface LinkFormProps {
  editor: LexicalEditor;
  initialUrl: string;
  onCancel: () => void;
  onDone: () => void;
}

const LinkForm = ({ editor, initialUrl, onCancel, onDone }: LinkFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftUrl, setDraftUrl] = useState(initialUrl);
  const url = draftUrl.trim();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const save = () => {
    if (!isSavableUrl(url)) {
      return;
    }
    const safeUrl = sanitizeUrl(url);
    editor.update(() => {
      const selection = $getSelection();
      if (
        $isRangeSelection(selection) &&
        selection.isCollapsed() &&
        !$getLinkAtSelection()
      ) {
        const link = $createLinkNode(safeUrl).append($createTextNode(url));
        $insertNodes([link]);
        link.selectEnd();
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, safeUrl);
      }
    });
    onDone();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <>
      <Input
        aria-label="Link address"
        className="h-7 flex-1"
        onChange={(event) => setDraftUrl(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://example.com"
        ref={inputRef}
        type="url"
        value={draftUrl}
      />
      <ToolbarButton label="Cancel" onClick={onCancel}>
        <XIcon />
      </ToolbarButton>
      <ToolbarButton
        disabled={!isSavableUrl(url)}
        label="Save link"
        onClick={save}
      >
        <CheckIcon />
      </ToolbarButton>
    </>
  );
};

interface FloatingLinkEditorPluginProps {
  anchorElem: HTMLElement;
  isLinkEditMode: boolean;
  setIsLinkEditMode: (isLinkEditMode: boolean) => void;
}

const FloatingLinkEditorPlugin = ({
  anchorElem,
  isLinkEditMode,
  setIsLinkEditMode,
}: FloatingLinkEditorPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const $updateLinkEditor = useCallback(() => {
    setLinkUrl($getLinkAtSelection()?.getURL() ?? null);

    const element = editorRef.current;
    if (!element || element.contains(document.activeElement)) {
      return;
    }
    const nativeSelection = getDOMSelection(editor._window);
    const rootElement = editor.getRootElement();
    const isInEditor =
      nativeSelection !== null &&
      nativeSelection.rangeCount > 0 &&
      rootElement?.contains(nativeSelection.anchorNode) === true;
    setFloatingElemPosition(
      isInEditor ? getSelectionRect(nativeSelection) : null,
      element,
      anchorElem,
      "below"
    );
  }, [anchorElem, editor]);

  useEffect(() => {
    const update = () => editor.getEditorState().read($updateLinkEditor);
    const scroller = anchorElem.parentElement;
    window.addEventListener("resize", update);
    scroller?.addEventListener("scroll", update);
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) =>
        editorState.read($updateLinkEditor)
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateLinkEditor();
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
  }, [anchorElem, editor, $updateLinkEditor]);

  const isVisible = linkUrl !== null || isLinkEditMode;

  useEffect(() => {
    if (isVisible) {
      editor.getEditorState().read($updateLinkEditor);
    }
  }, [editor, isLinkEditMode, isVisible, $updateLinkEditor]);

  if (!isVisible) {
    return null;
  }

  const finishEditing = () => {
    setIsLinkEditMode(false);
    restoreEditorFocus(editor);
  };

  // A link added from the toolbar starts as a placeholder until it has an address
  const cancelEditing = () => {
    if (linkUrl === EMPTY_LINK_URL) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
    finishEditing();
  };

  const safeUrl = sanitizeUrl(linkUrl ?? "");

  return createPortal(
    <div
      className="bg-popover text-popover-foreground ring-foreground/10 absolute top-0 left-0 z-30 flex w-80 max-w-[calc(100%-1rem)] items-center gap-1 p-1 opacity-0 shadow-md ring-1 transition-opacity will-change-transform"
      ref={editorRef}
    >
      {isLinkEditMode ? (
        <LinkForm
          editor={editor}
          initialUrl={
            linkUrl && linkUrl !== EMPTY_LINK_URL ? linkUrl : EMPTY_LINK_URL
          }
          onCancel={cancelEditing}
          onDone={finishEditing}
        />
      ) : (
        <>
          <a
            className="text-primary min-w-0 flex-1 truncate px-2 text-xs underline-offset-4 hover:underline"
            href={safeUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {linkUrl}
          </a>
          <ToolbarButton
            label="Open link"
            onClick={() => window.open(safeUrl, "_blank", "noopener")}
          >
            <ArrowSquareOutIcon />
          </ToolbarButton>
          <ToolbarButton
            label="Edit link"
            onClick={() => setIsLinkEditMode(true)}
          >
            <PencilSimpleIcon />
          </ToolbarButton>
          <ToolbarButton
            label="Remove link"
            onClick={() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)}
          >
            <LinkBreakIcon />
          </ToolbarButton>
        </>
      )}
    </div>,
    anchorElem
  );
};

export { FloatingLinkEditorPlugin };

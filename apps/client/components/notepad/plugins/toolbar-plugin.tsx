/**
 * The notepad's main toolbar for history, block type, font, size, text
 * formats and colors, alignment, inserts, the markdown source view and
 * files. It mirrors the formatting at the caret so active styles show
 * pressed.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $isCodeNode } from "@lexical/code";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  CodeIcon,
  HighlighterCircleIcon,
  LinkIcon,
  MarkdownLogoIcon,
  TextAUnderlineIcon,
  TextBIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from "@phosphor-icons/react";
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  type ElementFormatType,
  FORMAT_TEXT_COMMAND,
  KEY_MODIFIER_COMMAND,
  type NodeKey,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type TextFormatType,
  UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useState } from "react";

import { getShortcutPlatform } from "@/components/toolbar/utils";
import { Separator } from "@/components/ui/separator";

import { ColorPickerButton } from "../components/color-picker-button";
import { FontSizeControl } from "../components/font-size-control";
import { OpenNoteBtn } from "../components/open-note-btn";
import { SaveNoteBtn } from "../components/save-note-btn";
import { ToolbarButton } from "../components/toolbar-button";
import {
  AlignMenu,
  BlockTypeMenu,
  CodeLanguageSelect,
  FontFamilyMenu,
  InsertMenu,
  type TextStyleFormat,
  TextStyleMenu,
} from "../components/toolbar-menus";
import { $getBlockType, type BlockType, clearFormatting } from "../formatting";
import { getLanguageKey } from "../languages";
import { $isRubyNode } from "../nodes/ruby-node";
import {
  applyTextStyle,
  BACKGROUND_COLORS,
  DEFAULT_FONT_SIZE,
  TEXT_COLORS,
} from "../text-styles";
import { EMPTY_LINK_URL, getSelectedNode, sanitizeUrl } from "../utils";

const INLINE_FORMATS = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "highlight",
  "superscript",
  "subscript",
  "lowercase",
  "uppercase",
  "capitalize",
] as const satisfies TextFormatType[];

type InlineFormat = (typeof INLINE_FORMATS)[number];

interface ToolbarState {
  bgColor: string;
  blockType: BlockType;
  codeKey: NodeKey | null;
  codeLanguage: string;
  elementFormat: ElementFormatType;
  fontColor: string;
  fontFamily: string;
  fontSize: number;
  formats: Record<InlineFormat, boolean>;
  isCollapsed: boolean;
  isLink: boolean;
  isRuby: boolean;
}

const NO_FORMATS = Object.fromEntries(
  INLINE_FORMATS.map((format) => [format, false])
) as Record<InlineFormat, boolean>;

const INITIAL_STATE: ToolbarState = {
  bgColor: "",
  blockType: "paragraph",
  codeKey: null,
  codeLanguage: "",
  elementFormat: "",
  fontColor: "",
  fontFamily: "",
  fontSize: DEFAULT_FONT_SIZE,
  formats: NO_FORMATS,
  isCollapsed: true,
  isLink: false,
  isRuby: false,
};

const isSameState = (previous: ToolbarState, next: ToolbarState) =>
  (Object.keys(next) as (keyof ToolbarState)[]).every((key) =>
    key === "formats"
      ? INLINE_FORMATS.every(
          (format) => previous.formats[format] === next.formats[format]
        )
      : previous[key] === next[key]
  );

const $readToolbarState = (): ToolbarState => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return { ...INITIAL_STATE, blockType: $getBlockType(selection) };
  }
  const node = getSelectedNode(selection);
  const block = $findMatchingParent(
    node,
    (parent) => $isElementNode(parent) && !parent.isInline()
  );
  const code = $findMatchingParent(selection.anchor.getNode(), $isCodeNode);
  const formats = { ...NO_FORMATS };
  for (const format of INLINE_FORMATS) {
    formats[format] = selection.hasFormat(format);
  }
  const fontSize = Number.parseFloat(
    $getSelectionStyleValueForProperty(selection, "font-size", "")
  );
  return {
    bgColor: $getSelectionStyleValueForProperty(
      selection,
      "background-color",
      ""
    ),
    blockType: $getBlockType(selection),
    codeKey: code?.getKey() ?? null,
    codeLanguage: getLanguageKey(code?.getLanguage()),
    elementFormat: $isElementNode(block) ? block.getFormatType() : "",
    fontColor: $getSelectionStyleValueForProperty(selection, "color", ""),
    fontFamily: $getSelectionStyleValueForProperty(
      selection,
      "font-family",
      ""
    ),
    fontSize: Number.isFinite(fontSize) ? fontSize : DEFAULT_FONT_SIZE,
    formats,
    isCollapsed: selection.isCollapsed(),
    isLink: $isLinkNode(node) || $isLinkNode(node.getParent()),
    isRuby: $isRubyNode(node),
  };
};

const FORMAT_BUTTONS = [
  { format: "bold", icon: TextBIcon, key: "B", label: "Bold" },
  { format: "italic", icon: TextItalicIcon, key: "I", label: "Italic" },
  {
    format: "underline",
    icon: TextUnderlineIcon,
    key: "U",
    label: "Underline",
  },
  {
    format: "strikethrough",
    icon: TextStrikethroughIcon,
    key: "Shift+X",
    label: "Strikethrough",
  },
  { format: "code", icon: CodeIcon, key: "E", label: "Inline code" },
] as const;

const SHORTCUT_FORMATS: Record<string, InlineFormat> = {
  e: "code",
  "shift+h": "highlight",
  "shift+x": "strikethrough",
};

const ToolbarSeparator = () => (
  <Separator className="bg-foreground/15 mx-0.5 h-5" orientation="vertical" />
);

interface ToolbarPluginProps {
  isSourceMode: boolean;
  onToggleSourceMode: () => void;
  setIsLinkEditMode: (isLinkEditMode: boolean) => void;
}

const ToolbarPlugin = ({
  isSourceMode,
  onToggleSourceMode,
  setIsLinkEditMode,
}: ToolbarPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState(INITIAL_STATE);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [platform] = useState(getShortcutPlatform);

  const mod = platform === "mac" ? "⌘" : "Ctrl";
  const redoShortcut = platform === "mac" ? "⌘+Shift+Z" : "Ctrl+Y";
  const isCode = state.blockType === "code";
  const isTextDisabled = isSourceMode || isCode;

  const toggleLink = useCallback(() => {
    if (state.isLink) {
      setIsLinkEditMode(false);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    setIsLinkEditMode(true);
    if (!state.isCollapsed) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(EMPTY_LINK_URL));
    }
  }, [editor, setIsLinkEditMode, state.isCollapsed, state.isLink]);

  useEffect(() => {
    const updateState = () => {
      const next = $readToolbarState();
      setState((previous) => (isSameState(previous, next) ? previous : next));
    };

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) =>
        editorState.read(updateState)
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateState();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor]);

  useEffect(
    () =>
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event) => {
          if (!(event.ctrlKey || event.metaKey) || event.altKey) {
            return false;
          }
          const key = `${event.shiftKey ? "shift+" : ""}${event.key.toLowerCase()}`;
          if (key === "k") {
            event.preventDefault();
            toggleLink();
            return true;
          }
          if (key === "\\") {
            event.preventDefault();
            clearFormatting(editor);
            return true;
          }
          const format = SHORTCUT_FORMATS[key];
          if (format) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_NORMAL
      ),
    [editor, toggleLink]
  );

  const styleFormats: Record<TextStyleFormat, boolean> = {
    capitalize: state.formats.capitalize,
    highlight: state.formats.highlight,
    lowercase: state.formats.lowercase,
    subscript: state.formats.subscript,
    superscript: state.formats.superscript,
    uppercase: state.formats.uppercase,
  };

  return (
    <div
      aria-label="Notepad formatting"
      className="flex min-h-fit flex-wrap items-center gap-0.5 bg-[color:var(--toolbar-bg-secondary)] p-1 text-[color:var(--toolbar-foreground)]"
      role="toolbar"
    >
      <ToolbarButton
        disabled={!canUndo || isSourceMode}
        label="Undo"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        shortcut={`${mod}+Z`}
      >
        <ArrowUUpLeftIcon />
      </ToolbarButton>
      <ToolbarButton
        disabled={!canRedo || isSourceMode}
        label="Redo"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        shortcut={redoShortcut}
      >
        <ArrowUUpRightIcon />
      </ToolbarButton>
      <ToolbarSeparator />

      <BlockTypeMenu blockType={state.blockType} disabled={isSourceMode} />
      <ToolbarSeparator />

      {isCode && state.codeKey ? (
        <CodeLanguageSelect
          codeKey={state.codeKey}
          language={state.codeLanguage}
        />
      ) : (
        <>
          <FontFamilyMenu disabled={isTextDisabled} value={state.fontFamily} />
          <FontSizeControl disabled={isTextDisabled} size={state.fontSize} />
        </>
      )}
      <ToolbarSeparator />

      {FORMAT_BUTTONS.map(({ format, icon: FormatIcon, key, label }) => (
        <ToolbarButton
          disabled={isTextDisabled}
          key={format}
          label={label}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
          pressed={state.formats[format]}
          shortcut={`${mod}+${key}`}
        >
          <FormatIcon />
        </ToolbarButton>
      ))}
      <ToolbarButton
        disabled={isTextDisabled}
        label={state.isLink ? "Remove link" : "Link"}
        onClick={toggleLink}
        pressed={state.isLink}
        shortcut={`${mod}+K`}
      >
        <LinkIcon />
      </ToolbarButton>
      <ColorPickerButton
        colors={TEXT_COLORS}
        disabled={isTextDisabled}
        icon={TextAUnderlineIcon}
        label="Text color"
        onChange={(color) => applyTextStyle(editor, { color })}
        value={state.fontColor}
      />
      <ColorPickerButton
        colors={BACKGROUND_COLORS}
        disabled={isTextDisabled}
        icon={HighlighterCircleIcon}
        label="Background color"
        onChange={(color) =>
          applyTextStyle(editor, { "background-color": color })
        }
        value={state.bgColor}
      />
      <TextStyleMenu
        disabled={isTextDisabled}
        formats={styleFormats}
        hasSelection={!state.isCollapsed}
        isRuby={state.isRuby}
        mod={mod}
      />
      <ToolbarSeparator />

      <AlignMenu disabled={isSourceMode} format={state.elementFormat} />
      <InsertMenu disabled={isSourceMode} />

      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton
          label="Source mode"
          onClick={onToggleSourceMode}
          pressed={isSourceMode}
        >
          <MarkdownLogoIcon />
        </ToolbarButton>
        <OpenNoteBtn />
        <SaveNoteBtn />
      </div>
    </div>
  );
};

export { ToolbarPlugin };

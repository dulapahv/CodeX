/**
 * Menu configuration constants and icon imports.
 * Features:
 * - Menu item definitions
 * - Icon imports
 * - Keyboard shortcut mapping
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  ArrowCircleDownIcon,
  ArrowCircleUpIcon,
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowFatDownIcon,
  ArrowFatLinesDownIcon,
  ArrowFatLinesUpIcon,
  ArrowFatUpIcon,
  ArrowLineDownIcon,
  ArrowLineUpIcon,
  ArrowsInLineVerticalIcon,
  ArrowsInSimpleIcon,
  ArrowsLeftRightIcon,
  ArrowsOutLineVerticalIcon,
  ArrowsOutSimpleIcon,
  ArrowsVerticalIcon,
  ArrowUpIcon,
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  AtIcon,
  BackspaceIcon,
  BracketsCurlyIcon,
  BracketsRoundIcon,
  BracketsSquareIcon,
  CaretDoubleDownIcon,
  CaretDoubleUpIcon,
  ChatCenteredTextIcon,
  ChatCircleDotsIcon,
  ChatIcon,
  ChatSlashIcon,
  ChatTextIcon,
  ClipboardIcon,
  CloudArrowUpIcon,
  CommandIcon,
  CopyIcon,
  CopySimpleIcon,
  CornersInIcon,
  CornersOutIcon,
  CrosshairIcon,
  CursorClickIcon,
  CursorTextIcon,
  DownloadSimpleIcon,
  EraserIcon,
  EyeIcon,
  FolderIcon,
  GearIcon,
  GitForkIcon,
  HashIcon,
  InfoIcon,
  KeyboardIcon,
  LayoutIcon,
  LightbulbIcon,
  LinkIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  MinusSquareIcon,
  NotebookIcon,
  PackageIcon,
  PaintBrushIcon,
  PencilLineIcon,
  PlusSquareIcon,
  QuestionIcon,
  RowsIcon,
  RowsPlusBottomIcon,
  RowsPlusTopIcon,
  ScissorsIcon,
  SelectionAllIcon,
  SelectionIcon,
  SelectionPlusIcon,
  SignOutIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  SparkleIcon,
  SwapIcon,
  TerminalWindowIcon,
  TextAaIcon,
  TextIndentIcon,
  TextOutdentIcon,
  VideoCameraIcon,
  WrenchIcon,
} from "@phosphor-icons/react";

import type { ShortcutPlatform, ToolbarActions } from "./types";

export interface MenuItem {
  action: keyof ToolbarActions;
  checked?: boolean;
  icon?: React.ReactNode;
  items?: MenuItem[];
  label: string;
  shortcut?: string;
  type?: "checkbox";
}

export interface MenuGroup {
  items: (MenuItem | "separator")[];
  label: string;
}

export const createMenuConfig = (
  platform: ShortcutPlatform,
  notepad: boolean,
  terminal: boolean,
  webcam: boolean,
  livePreview: boolean
) => {
  const modKey = platform === "mac" ? "⌘" : "Ctrl";

  // Monaco binds some commands differently on macOS and Linux
  const keys = (
    shortcut: string,
    overrides: Partial<Record<ShortcutPlatform, string>> = {}
  ) => overrides[platform] ?? shortcut;

  const menuConfig: MenuGroup[] = [
    {
      items: [
        {
          action: "openLocal",
          icon: <FolderIcon className="size-4" />,
          label: "Open from Local",
          shortcut: `${modKey}+O`,
        },
        {
          action: "openRepository",
          icon: <GitForkIcon className="size-4" />,
          label: "Open from repository…",
          shortcut: `${modKey}+Shift+O`,
        },
        {
          action: "saveLocal",
          icon: <DownloadSimpleIcon className="size-4" />,
          label: "Save to Local",
          shortcut: `${modKey}+S`,
        },
        {
          action: "saveRepository",
          icon: <CloudArrowUpIcon className="size-4" />,
          label: "Save to repository…",
          shortcut: `${modKey}+Shift+S`,
        },
        "separator",
        {
          action: "settings",
          icon: <GearIcon className="size-4" />,
          label: "Settings",
          shortcut: `${modKey}+,`,
        },
        "separator",
        {
          action: "leaveRoom",
          icon: <SignOutIcon className="size-4" />,
          label: "Leave Room",
          shortcut: `${modKey}+Q`,
        },
      ],
      label: "File",
    },
    {
      items: [
        {
          action: "undo",
          icon: <ArrowUUpLeftIcon className="size-4" />,
          label: "Undo",
          shortcut: `${modKey}+Z`,
        },
        {
          action: "redo",
          icon: <ArrowUUpRightIcon className="size-4" />,
          label: "Redo",
          shortcut: keys(`${modKey}+Y`, { mac: `${modKey}+Shift+Z` }),
        },
        "separator",
        {
          action: "cut",
          icon: <ScissorsIcon className="size-4" />,
          label: "Cut",
          shortcut: `${modKey}+X`,
        },
        {
          action: "copy",
          icon: <CopyIcon className="size-4" />,
          label: "Copy",
          shortcut: `${modKey}+C`,
        },
        {
          action: "paste",
          icon: <ClipboardIcon className="size-4" />,
          label: "Paste",
          shortcut: `${modKey}+V`,
        },
        "separator",
        {
          action: "find",
          icon: <MagnifyingGlassIcon className="size-4" />,
          label: "Find",
          shortcut: `${modKey}+F`,
        },
        {
          action: "replace",
          icon: <SwapIcon className="size-4" />,
          label: "Replace",
          shortcut: keys(`${modKey}+H`, { mac: `${modKey}+Alt+F` }),
        },
        {
          action: "findNext",
          icon: <ArrowDownIcon className="size-4" />,
          label: "Find Next",
          shortcut: keys("F3", { mac: `${modKey}+G` }),
        },
        {
          action: "findPrevious",
          icon: <ArrowUpIcon className="size-4" />,
          label: "Find Previous",
          shortcut: keys("Shift+F3", { mac: `${modKey}+Shift+G` }),
        },
        "separator",
        {
          action: "toggleLineComment",
          icon: <ChatIcon className="size-4" />,
          label: "Toggle Line Comment",
          shortcut: `${modKey}+/`,
        },
        {
          action: "toggleBlockComment",
          icon: <ChatTextIcon className="size-4" />,
          label: "Toggle Block Comment",
          shortcut: keys("Shift+Alt+A", { linux: "Ctrl+Shift+A" }),
        },
        {
          action: "addLineComment",
          icon: <ChatCenteredTextIcon className="size-4" />,
          label: "Add Line Comment",
          shortcut: `${modKey}+K ${modKey}+C`,
        },
        {
          action: "removeLineComment",
          icon: <ChatSlashIcon className="size-4" />,
          label: "Remove Line Comment",
          shortcut: `${modKey}+K ${modKey}+U`,
        },
        "separator",
        {
          action: "uppercase",
          icon: <ArrowFatUpIcon className="size-4" />,
          label: "UPPERCASE",
        },
        {
          action: "lowercase",
          icon: <ArrowFatDownIcon className="size-4" />,
          label: "lowercase",
        },
        {
          action: "titleCase",
          icon: <TextAaIcon className="size-4" />,
          label: "Title Case",
        },
        "separator",
        {
          action: "sortLinesAscending",
          icon: <SortAscendingIcon className="size-4" />,
          label: "Sort Lines Ascending",
        },
        {
          action: "sortLinesDescending",
          icon: <SortDescendingIcon className="size-4" />,
          label: "Sort Lines Descending",
        },
      ],
      label: "Edit",
    },
    {
      items: [
        {
          action: "selectAll",
          icon: <CursorClickIcon className="size-4" />,
          label: "Select All",
          shortcut: `${modKey}+A`,
        },
        {
          action: "expandLineSelection",
          icon: <RowsIcon className="size-4" />,
          label: "Expand Line Selection",
          shortcut: `${modKey}+L`,
        },
        {
          action: "selectToBracket",
          icon: <SelectionIcon className="size-4" />,
          label: "Select to Bracket",
        },
        {
          action: "selectHighlights",
          icon: <SelectionAllIcon className="size-4" />,
          label: "Select Highlights",
          shortcut: `${modKey}+Shift+L`,
        },
        "separator",
        {
          action: "copyLineUp",
          icon: <CaretDoubleUpIcon className="size-4" />,
          label: "Copy Line Up",
          shortcut: keys("Shift+Alt+↑", { linux: "Ctrl+Shift+Alt+↑" }),
        },
        {
          action: "copyLineDown",
          icon: <CaretDoubleDownIcon className="size-4" />,
          label: "Copy Line Down",
          shortcut: keys("Shift+Alt+↓", { linux: "Ctrl+Shift+Alt+↓" }),
        },
        {
          action: "moveLineUp",
          icon: <ArrowLineUpIcon className="size-4" />,
          label: "Move Line Up",
          shortcut: "Alt+↑",
        },
        {
          action: "moveLineDown",
          icon: <ArrowLineDownIcon className="size-4" />,
          label: "Move Line Down",
          shortcut: "Alt+↓",
        },
        {
          action: "duplicateSelection",
          icon: <CopySimpleIcon className="size-4" />,
          label: "Duplicate Selection",
        },
        "separator",
        {
          action: "insertLineAbove",
          icon: <RowsPlusTopIcon className="size-4" />,
          label: "Insert Line Above",
          shortcut: `${modKey}+Shift+Enter`,
        },
        {
          action: "insertLineBelow",
          icon: <RowsPlusBottomIcon className="size-4" />,
          label: "Insert Line Below",
          shortcut: `${modKey}+Enter`,
        },
        {
          action: "deleteLine",
          icon: <BackspaceIcon className="size-4" />,
          label: "Delete Line",
          shortcut: `${modKey}+Shift+K`,
        },
        {
          action: "indentLine",
          icon: <TextIndentIcon className="size-4" />,
          label: "Indent Line",
          shortcut: `${modKey}+]`,
        },
        {
          action: "outdentLine",
          icon: <TextOutdentIcon className="size-4" />,
          label: "Outdent Line",
          shortcut: `${modKey}+[`,
        },
        "separator",
        {
          action: "addCursorAbove",
          icon: <ArrowFatLinesUpIcon className="size-4" />,
          label: "Add Cursor Above",
          shortcut: keys(`${modKey}+Alt+↑`, { linux: "Shift+Alt+↑" }),
        },
        {
          action: "addCursorBelow",
          icon: <ArrowFatLinesDownIcon className="size-4" />,
          label: "Add Cursor Below",
          shortcut: keys(`${modKey}+Alt+↓`, { linux: "Shift+Alt+↓" }),
        },
        {
          action: "addCursorsToLineEnds",
          icon: <CursorTextIcon className="size-4" />,
          label: "Add Cursors to Line Ends",
          shortcut: "Shift+Alt+I",
        },
        {
          action: "addNextOccurrence",
          icon: <SelectionPlusIcon className="size-4" />,
          label: "Add Next Occurrence",
          shortcut: `${modKey}+D`,
        },
        {
          action: "cursorUndo",
          icon: <ArrowCounterClockwiseIcon className="size-4" />,
          label: "Cursor Undo",
          shortcut: `${modKey}+U`,
        },
        "separator",
        {
          action: "expandSelection",
          icon: <ArrowsOutSimpleIcon className="size-4" />,
          label: "Expand Selection",
          shortcut: keys("Shift+Alt+→", { mac: `Ctrl+Shift+${modKey}+→` }),
        },
        {
          action: "shrinkSelection",
          icon: <ArrowsInSimpleIcon className="size-4" />,
          label: "Shrink Selection",
          shortcut: keys("Shift+Alt+←", { mac: `Ctrl+Shift+${modKey}+←` }),
        },
      ],
      label: "Selection",
    },
    {
      items: [
        {
          action: "commandPalette",
          icon: <CommandIcon className="size-4" />,
          label: "Command Palette",
          shortcut: "F1",
        },
        "separator",
        {
          action: "zoomIn",
          icon: <MagnifyingGlassPlusIcon className="size-4" />,
          label: "Zoom In",
          shortcut: `${modKey}+=`,
        },
        {
          action: "zoomOut",
          icon: <MagnifyingGlassMinusIcon className="size-4" />,
          label: "Zoom Out",
          shortcut: `${modKey}+-`,
        },
        "separator",
        {
          action: "fold",
          icon: <ArrowsInLineVerticalIcon className="size-4" />,
          label: "Fold",
          shortcut: keys(`${modKey}+Shift+[`, { mac: `${modKey}+Alt+[` }),
        },
        {
          action: "unfold",
          icon: <ArrowsOutLineVerticalIcon className="size-4" />,
          label: "Unfold",
          shortcut: keys(`${modKey}+Shift+]`, { mac: `${modKey}+Alt+]` }),
        },
        {
          action: "toggleFold",
          icon: <ArrowsVerticalIcon className="size-4" />,
          label: "Toggle Fold",
          shortcut: `${modKey}+K ${modKey}+L`,
        },
        {
          action: "foldRecursively",
          icon: <MinusSquareIcon className="size-4" />,
          label: "Fold Recursively",
          shortcut: `${modKey}+K ${modKey}+[`,
        },
        {
          action: "unfoldRecursively",
          icon: <PlusSquareIcon className="size-4" />,
          label: "Unfold Recursively",
          shortcut: `${modKey}+K ${modKey}+]`,
        },
        {
          action: "foldAll",
          icon: <CornersInIcon className="size-4" />,
          label: "Fold All",
          shortcut: `${modKey}+K ${modKey}+0`,
        },
        {
          action: "unfoldAll",
          icon: <CornersOutIcon className="size-4" />,
          label: "Unfold All",
          shortcut: `${modKey}+K ${modKey}+J`,
        },
        "separator",
        {
          action: "toggleTabFocusMode",
          icon: <KeyboardIcon className="size-4" />,
          label: "Toggle Tab Key Moves Focus",
          shortcut: keys(`${modKey}+M`, { mac: "Ctrl+Shift+M" }),
        },
        "separator",
        {
          action: "toggleNotepadPanel",
          checked: notepad,
          icon: <NotebookIcon className="size-4" />,
          label: "Notepad",
          type: "checkbox",
        },
        {
          action: "toggleTerminalPanel",
          checked: terminal,
          icon: <TerminalWindowIcon className="size-4" />,
          label: "Terminal",
          type: "checkbox",
        },
        {
          action: "toggleWebcamPanel",
          checked: webcam,
          icon: <VideoCameraIcon className="size-4" />,
          label: "Webcam Stream",
          type: "checkbox",
        },
        {
          action: "toggleSandpackPanel",
          checked: livePreview,
          icon: <LayoutIcon className="size-4" />,
          label: "Live Preview",
          type: "checkbox",
        },
      ],
      label: "View",
    },
    {
      items: [
        {
          action: "goToLine",
          icon: <HashIcon className="size-4" />,
          label: "Go to Line/Column…",
          shortcut: keys(`${modKey}+G`, { mac: "Ctrl+G" }),
        },
        {
          action: "goToSymbol",
          icon: <AtIcon className="size-4" />,
          label: "Go to Symbol…",
          shortcut: `${modKey}+Shift+O`,
        },
        {
          action: "goToBracket",
          icon: <BracketsCurlyIcon className="size-4" />,
          label: "Go to Bracket",
          shortcut: `${modKey}+Shift+\\`,
        },
        "separator",
        {
          action: "goToDefinition",
          icon: <CrosshairIcon className="size-4" />,
          label: "Go to Definition",
          // Browsers keep F12 for their developer tools
          shortcut: `${modKey}+F12`,
        },
        {
          action: "peekDefinition",
          icon: <EyeIcon className="size-4" />,
          label: "Peek Definition",
          shortcut: keys("Alt+F12", { linux: "Ctrl+Shift+F10" }),
        },
        {
          action: "goToReferences",
          icon: <LinkIcon className="size-4" />,
          label: "Go to References",
          shortcut: "Shift+F12",
        },
        "separator",
        {
          action: "nextProblem",
          icon: <ArrowCircleDownIcon className="size-4" />,
          label: "Next Problem",
          shortcut: "F8",
        },
        {
          action: "previousProblem",
          icon: <ArrowCircleUpIcon className="size-4" />,
          label: "Previous Problem",
          shortcut: "Shift+F8",
        },
      ],
      label: "Go",
    },
    {
      items: [
        {
          action: "formatDocument",
          icon: <MagicWandIcon className="size-4" />,
          label: "Format Document",
          shortcut: keys("Shift+Alt+F", { linux: "Ctrl+Shift+I" }),
        },
        {
          action: "formatSelection",
          icon: <PaintBrushIcon className="size-4" />,
          label: "Format Selection",
          shortcut: `${modKey}+K ${modKey}+F`,
        },
        {
          action: "trimTrailingWhitespace",
          icon: <EraserIcon className="size-4" />,
          label: "Trim Trailing Whitespace",
          shortcut: `${modKey}+K ${modKey}+X`,
        },
        "separator",
        {
          action: "renameSymbol",
          icon: <PencilLineIcon className="size-4" />,
          label: "Rename Symbol",
          shortcut: "F2",
        },
        {
          action: "changeAllOccurrences",
          icon: <ArrowsLeftRightIcon className="size-4" />,
          label: "Change All Occurrences",
          shortcut: `${modKey}+F2`,
        },
        {
          action: "refactor",
          icon: <WrenchIcon className="size-4" />,
          label: "Refactor…",
          shortcut: "Ctrl+Shift+R",
        },
        {
          action: "quickFix",
          icon: <LightbulbIcon className="size-4" />,
          label: "Quick Fix…",
          shortcut: `${modKey}+.`,
        },
        {
          action: "organizeImports",
          icon: <PackageIcon className="size-4" />,
          label: "Organize Imports",
          shortcut: "Shift+Alt+O",
        },
        {
          action: "removeBrackets",
          icon: <BracketsSquareIcon className="size-4" />,
          label: "Remove Brackets",
          shortcut: `${modKey}+Alt+Backspace`,
        },
        "separator",
        {
          action: "triggerSuggest",
          icon: <SparkleIcon className="size-4" />,
          label: "Trigger Suggest",
          shortcut: keys(`${modKey}+Space`, { mac: "Ctrl+Space" }),
        },
        {
          action: "triggerParameterHints",
          icon: <BracketsRoundIcon className="size-4" />,
          label: "Trigger Parameter Hints",
          shortcut: `${modKey}+Shift+Space`,
        },
        {
          action: "showHover",
          icon: <ChatCircleDotsIcon className="size-4" />,
          label: "Show Hover",
          shortcut: `${modKey}+K ${modKey}+I`,
        },
      ],
      label: "Code",
    },
    {
      items: [
        {
          action: "manual",
          icon: <QuestionIcon className="size-4" />,
          label: "Manual",
        },
        {
          action: "about",
          icon: <InfoIcon className="size-4" />,
          label: "About",
        },
      ],
      label: "Help",
    },
  ];

  return menuConfig;
};

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
  ArrowBigDownDash,
  ArrowBigUpDash,
  ArrowDownToLine,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArrowUpToLine,
  CaseLower,
  CaseSensitive,
  CaseUpper,
  ChevronsDown,
  ChevronsUp,
  Clipboard,
  CloudUpload,
  Command,
  Copy,
  CopyPlus,
  Download,
  FlipVertical,
  Folder,
  FolderGit2,
  FoldVertical,
  HelpCircle,
  Info,
  LayoutTemplate,
  LogOut,
  Maximize2,
  MessageSquare,
  MessageSquareText,
  Minimize2,
  MousePointerClick,
  NotebookPen,
  Redo2,
  Replace,
  Scissors,
  Search,
  Settings,
  SquareDashedMousePointer,
  Terminal,
  TextSelect,
  Undo2,
  UnfoldVertical,
  Video,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import type { ToolbarActions } from './types';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: keyof ToolbarActions;
  items?: MenuItem[];
  type?: 'checkbox';
  checked?: boolean;
}

export interface MenuGroup {
  label: string;
  items: (MenuItem | 'separator')[];
}

export const createMenuConfig = (
  modKey: string,
  notepad: boolean,
  terminal: boolean,
  webcam: boolean,
  livePreview: boolean,
) => {
  const menuConfig: MenuGroup[] = [
    {
      label: 'File',
      items: [
        {
          label: 'Open from Local',
          icon: <Folder className="mr-2 size-4" />,
          shortcut: `${modKey}+O`,
          action: 'openLocal',
        },
        {
          label: 'Open from GitHub',
          icon: <FolderGit2 className="mr-2 size-4" />,
          shortcut: `${modKey}+Shift+O`,
          action: 'openGitHub',
        },
        {
          label: 'Save to Local',
          icon: <Download className="mr-2 size-4" />,
          shortcut: `${modKey}+S`,
          action: 'saveLocal',
        },
        {
          label: 'Save to GitHub',
          icon: <CloudUpload className="mr-2 size-4" />,
          shortcut: `${modKey}+Shift+S`,
          action: 'saveGitHub',
        },
        'separator',
        {
          label: 'Settings',
          icon: <Settings className="mr-2 size-4" />,
          shortcut: `${modKey}+,`,
          action: 'settings',
        },
        'separator',
        {
          label: 'Leave Room',
          icon: <LogOut className="mr-2 size-4" />,
          shortcut: `${modKey}+Q`,
          action: 'leaveRoom',
        },
      ],
    },
    {
      label: 'Edit',
      items: [
        {
          label: 'Undo',
          icon: <Undo2 className="mr-2 size-4" />,
          shortcut: `${modKey}+Z`,
          action: 'undo',
        },
        {
          label: 'Redo',
          icon: <Redo2 className="mr-2 size-4" />,
          shortcut: `${modKey}+Y`,
          action: 'redo',
        },
        'separator',
        {
          label: 'Cut',
          icon: <Scissors className="mr-2 size-4" />,
          shortcut: `${modKey}+X`,
          action: 'cut',
        },
        {
          label: 'Copy',
          icon: <Copy className="mr-2 size-4" />,
          shortcut: `${modKey}+C`,
          action: 'copy',
        },
        {
          label: 'Paste',
          icon: <Clipboard className="mr-2 size-4" />,
          shortcut: `${modKey}+V`,
          action: 'paste',
        },
        'separator',
        {
          label: 'Find',
          icon: <Search className="mr-2 size-4" />,
          shortcut: `${modKey}+F`,
          action: 'find',
        },
        {
          label: 'Replace',
          icon: <Replace className="mr-2 size-4" />,
          shortcut: `${modKey}+H`,
          action: 'replace',
        },
        'separator',
        {
          label: 'Toggle Line Comment',
          icon: <MessageSquare className="mr-2 size-4" />,
          shortcut: `${modKey}+/`,
          action: 'toggleLineComment',
        },
        {
          label: 'Toggle Block Comment',
          icon: <MessageSquareText className="mr-2 size-4" />,
          shortcut: `Shift+Alt+A`,
          action: 'toggleBlockComment',
        },
        'separator',
        {
          label: 'UPPERCASE',
          icon: <CaseUpper className="mr-2 size-4" />,
          action: 'uppercase',
        },
        {
          label: 'lowercase',
          icon: <CaseLower className="mr-2 size-4" />,
          action: 'lowercase',
        },
        {
          label: 'Title Case',
          icon: <CaseSensitive className="mr-2 size-4" />,
          action: 'titleCase',
        },
        'separator',
        {
          label: 'Sort Lines Ascending',
          icon: <ArrowUpNarrowWide className="mr-2 size-4" />,
          action: 'sortLinesAscending',
        },
        {
          label: 'Sort Lines Descending',
          icon: <ArrowDownWideNarrow className="mr-2 size-4" />,
          action: 'sortLinesDescending',
        },
      ],
    },
    {
      label: 'Selection',
      items: [
        {
          label: 'Select All',
          icon: <MousePointerClick className="mr-2 size-4" />,
          shortcut: `${modKey}+A`,
          action: 'selectAll',
        },
        {
          label: 'Select to Bracket',
          icon: <SquareDashedMousePointer className="mr-2 size-4" />,
          action: 'selectToBracket',
        },
        {
          label: 'Select Highlights',
          icon: <TextSelect className="mr-2 size-4" />,
          action: 'selectHighlights',
        },
        'separator',
        {
          label: 'Copy Line Up',
          icon: <ChevronsUp className="mr-2 size-4" />,
          shortcut: 'Shift+Alt+↑',
          action: 'copyLineUp',
        },
        {
          label: 'Copy Line Down',
          icon: <ChevronsDown className="mr-2 size-4" />,
          shortcut: 'Shift+Alt+↓',
          action: 'copyLineDown',
        },
        {
          label: 'Move Line Up',
          icon: <ArrowUpToLine className="mr-2 size-4" />,
          shortcut: 'Alt+↑',
          action: 'moveLineUp',
        },
        {
          label: 'Move Line Down',
          icon: <ArrowDownToLine className="mr-2 size-4" />,
          shortcut: 'Alt+↓',
          action: 'moveLineDown',
        },
        {
          label: 'Duplicate Selection',
          icon: <CopyPlus className="mr-2 size-4" />,
          action: 'duplicateSelection',
        },
        'separator',
        {
          label: 'Add Cursor Above',
          icon: <ArrowBigUpDash className="mr-2 size-4" />,
          shortcut: `${modKey}+Alt+↑`,
          action: 'addCursorAbove',
        },
        {
          label: 'Add Cursor Below',
          icon: <ArrowBigDownDash className="mr-2 size-4" />,
          shortcut: `${modKey}+Alt+↓`,
          action: 'addCursorBelow',
        },
        'separator',
        {
          label: 'Expand Selection',
          icon: <Maximize2 className="mr-2 size-4" />,
          action: 'expandSelection',
        },
        {
          label: 'Shrink Selection',
          icon: <Minimize2 className="mr-2 size-4" />,
          action: 'shrinkSelection',
        },
      ],
    },
    {
      label: 'View',
      items: [
        {
          label: 'Command Palette',
          icon: <Command className="mr-2 size-4" />,
          shortcut: 'F1',
          action: 'commandPalette',
        },
        'separator',
        {
          label: 'Zoom In',
          icon: <ZoomIn className="mr-2 size-4" />,
          shortcut: `${modKey}+=`,
          action: 'zoomIn',
        },
        {
          label: 'Zoom Out',
          icon: <ZoomOut className="mr-2 size-4" />,
          shortcut: `${modKey}+-`,
          action: 'zoomOut',
        },
        'separator',
        {
          label: 'Fold All',
          icon: <FoldVertical className="mr-2 size-4" />,
          action: 'foldAll',
        },
        {
          label: 'Unfold All',
          icon: <UnfoldVertical className="mr-2 size-4" />,
          action: 'unfoldAll',
        },
        {
          label: 'Toggle Fold',
          icon: <FlipVertical className="mr-2 size-4" />,
          action: 'toggleFold',
        },
        'separator',
        {
          label: 'Notepad',
          icon: <NotebookPen className="mr-2 size-4" />,
          type: 'checkbox',
          checked: notepad,
          action: 'toggleNotepadPanel',
        },
        {
          label: 'Terminal',
          icon: <Terminal className="mr-2 size-4" />,
          type: 'checkbox',
          checked: terminal,
          action: 'toggleTerminalPanel',
        },
        {
          label: 'Webcam Stream',
          icon: <Video className="mr-2 size-4" />,
          type: 'checkbox',
          checked: webcam,
          action: 'toggleWebcamPanel',
        },
        {
          label: 'Live Preview',
          icon: <LayoutTemplate className="mr-2 size-4" />,
          type: 'checkbox',
          checked: livePreview,
          action: 'toggleSandpackPanel',
        },
      ],
    },
    {
      label: 'Help',
      items: [
        {
          label: 'Manual',
          icon: <HelpCircle className="mr-2 size-4" />,
          action: 'manual',
        },
        {
          label: 'About',
          icon: <Info className="mr-2 size-4" />,
          action: 'about',
        },
      ],
    },
  ];

  return menuConfig;
};

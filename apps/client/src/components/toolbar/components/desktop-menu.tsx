import { useEffect, useRef } from 'react';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';

import type { ToolbarActions } from '../types';

interface DesktopMenuProps {
  modKey: string;
  actions: ToolbarActions;
  notepad: boolean;
  terminal: boolean;
  webcam: boolean;
  livePreview: boolean;
}

const DesktopMenu = ({
  modKey,
  actions,
  notepad,
  terminal,
  webcam,
  livePreview,
}: DesktopMenuProps) => {
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        menuTriggerRef.current?.focus();
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  return (
    <Menubar className="hidden h-fit border-none bg-transparent p-0 sm:flex">
      <MenubarMenu>
        <MenubarTrigger
          ref={menuTriggerRef}
          className="px-2 py-1 font-normal transition-colors hover:bg-accent
            hover:text-accent-foreground"
        >
          File
        </MenubarTrigger>
        <MenubarContent className="ml-1" loop>
          <MenubarItem onSelect={actions.openLocal}>
            Open from Local <MenubarShortcut>{modKey}+O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.openGitHub} className="gap-x-4">
            Open from GitHub <MenubarShortcut>{modKey}+Shift+O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.saveLocal}>
            Save to local <MenubarShortcut>{modKey}+S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.saveGitHub}>
            Save to GitHub <MenubarShortcut>{modKey}+Shift+S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.settings}>
            Settings
            <MenubarShortcut>{modKey}+,</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.leaveRoom}>
            Leave Room <MenubarShortcut>{modKey}+Q</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger
          className="px-2 py-1 font-normal transition-colors hover:bg-accent
            hover:text-accent-foreground"
        >
          Edit
        </MenubarTrigger>
        <MenubarContent className="ml-1" loop>
          <MenubarItem onSelect={actions.undo}>
            Undo <MenubarShortcut>{modKey}+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.redo}>
            Redo <MenubarShortcut>{modKey}+Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.cut}>
            Cut <MenubarShortcut>{modKey}+X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.copy}>
            Copy <MenubarShortcut>{modKey}+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.paste}>
            Paste <MenubarShortcut>{modKey}+V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.find}>
            Find <MenubarShortcut>{modKey}+F</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.replace}>
            Replace <MenubarShortcut>{modKey}+H</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.toggleLineComment}>
            Toggle Line Comment <MenubarShortcut>{modKey}+/</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={actions.toggleBlockComment}
            className="gap-x-4"
          >
            Toggle Block Comment
            <MenubarShortcut>{modKey}+Shift+/</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.uppercase}>UPPERCASE</MenubarItem>
          <MenubarItem onSelect={actions.lowercase}>lowercase</MenubarItem>
          <MenubarItem onSelect={actions.titleCase}>Title Case</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.sortLinesAscending}>
            Sort Lines Ascending
          </MenubarItem>
          <MenubarItem onSelect={actions.sortLinesDescending}>
            Sort Lines Descending
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger
          className="px-2 py-1 font-normal transition-colors hover:bg-accent
            hover:text-accent-foreground"
        >
          Selection
        </MenubarTrigger>
        <MenubarContent className="ml-1" loop>
          <MenubarItem onSelect={actions.selectAll}>
            Select All <MenubarShortcut>{modKey}+A</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.selectToBracket}>
            Select to Bracket
          </MenubarItem>
          <MenubarItem onSelect={actions.selectHighlights}>
            Select Highlights
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.copyLineUp}>
            Copy Line Up <MenubarShortcut>Shift+Alt+↑</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.copyLineDown}>
            Copy Line Down <MenubarShortcut>Shift+Alt+↓</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.moveLineUp}>
            Move Line Up <MenubarShortcut>Alt+↑</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.moveLineDown}>
            Move Line Down <MenubarShortcut>Alt+↓</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.duplicateSelection}>
            Duplicate Selection
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.addCursorAbove} className="gap-x-4">
            Add Cursor Above <MenubarShortcut>{modKey}+Alt+↑</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.addCursorBelow}>
            Add Cursor Below <MenubarShortcut>{modKey}+Alt+↓</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.expandSelection}>
            Expand Selection
          </MenubarItem>
          <MenubarItem onSelect={actions.shrinkSelection}>
            Shrink Selection
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger
          className="px-2 py-1 font-normal transition-colors hover:bg-accent
            hover:text-accent-foreground"
        >
          View
        </MenubarTrigger>
        <MenubarContent className="ml-1" loop>
          <MenubarItem onSelect={actions.commandPalette}>
            Command Palette <MenubarShortcut>F1</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.zoomIn}>
            Zoom In <MenubarShortcut>Ctrl+=</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.zoomOut}>
            Zoom Out <MenubarShortcut>Ctrl+-</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={actions.foldAll}>Fold All</MenubarItem>
          <MenubarItem onSelect={actions.unfoldAll}>Unfold All</MenubarItem>
          <MenubarItem onSelect={actions.toggleFold}>Toggle Fold</MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem
            onCheckedChange={actions.toggleNotepadPanel}
            checked={notepad}
          >
            Notepad
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            onCheckedChange={actions.toggleTerminalPanel}
            checked={terminal}
          >
            Terminal
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            onCheckedChange={actions.toggleWebcamPanel}
            checked={webcam}
          >
            Webcam Stream
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            onCheckedChange={actions.toggleSandpackPanel}
            checked={livePreview}
          >
            Live Preview
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger
          className="px-2 py-1 font-normal transition-colors hover:bg-accent
            hover:text-accent-foreground"
        >
          Help
        </MenubarTrigger>
        <MenubarContent className="ml-1" loop>
          <MenubarItem onSelect={actions.manual}>Manual</MenubarItem>
          <MenubarItem onSelect={actions.about}>About</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export { DesktopMenu };

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
  miniMap: boolean;
  wordWrap: boolean;
  markdown: boolean;
  terminal: boolean;
  webcam: boolean;
}

const DesktopMenu = ({
  modKey,
  actions,
  miniMap,
  wordWrap,
  markdown,
  terminal,
  webcam,
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
          className="px-2 py-1 font-normal transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          File
        </MenubarTrigger>
        <MenubarContent className="ml-1" loop>
          <MenubarItem onSelect={actions.openLocal}>
            Open Local File <MenubarShortcut>{modKey}+O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.openGitHub}>
            Open GitHub File <MenubarShortcut>{modKey}+Shift+O</MenubarShortcut>
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
        <MenubarTrigger className="px-2 py-1 font-normal transition-colors hover:bg-accent hover:text-accent-foreground">
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
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="px-2 py-1 font-normal transition-colors hover:bg-accent hover:text-accent-foreground">
          Selection
        </MenubarTrigger>
        <MenubarContent className="ml-1" loop>
          <MenubarItem onSelect={actions.selectAll}>
            Select All <MenubarShortcut>{modKey}+A</MenubarShortcut>
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
          <MenubarItem onSelect={actions.addCursorAbove}>
            Add Cursor Above <MenubarShortcut>{modKey}+Alt+↑</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={actions.addCursorBelow}>
            Add Cursor Below <MenubarShortcut>{modKey}+Alt+↓</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="px-2 py-1 font-normal transition-colors hover:bg-accent hover:text-accent-foreground">
          View
        </MenubarTrigger>
        <MenubarContent className="ml-1" loop>
          <MenubarItem onSelect={actions.commandPalette}>
            Command Palette <MenubarShortcut>F1</MenubarShortcut>
          </MenubarItem>
          <MenubarCheckboxItem
            onCheckedChange={actions.wordWrap}
            checked={wordWrap}
          >
            Word Wrap
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarCheckboxItem
            onCheckedChange={actions.minimap}
            checked={miniMap}
          >
            Minimap
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            onCheckedChange={actions.toggleMarkdownPanel}
            checked={markdown}
          >
            Markdown Editor
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
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="px-2 py-1 font-normal transition-colors hover:bg-accent hover:text-accent-foreground">
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

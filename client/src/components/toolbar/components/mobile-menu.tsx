import { useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';

import type { ToolbarActions } from '../types';

interface MobileMenuProps {
  actions: ToolbarActions;
  miniMap: boolean;
  wordWrap: boolean;
  markdown: boolean;
  terminal: boolean;
  webcam: boolean;
}

const MobileMenu = ({
  actions,
  miniMap,
  wordWrap,
  markdown,
  terminal,
  webcam,
}: MobileMenuProps) => {
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        menuTriggerRef.current?.focus();
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  return (
    <Menubar className="flex h-fit animate-fade-in border-none bg-transparent p-0 sm:hidden">
      <MenubarMenu>
        <MenubarTrigger
          ref={menuTriggerRef}
          className="px-2 py-1"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </MenubarTrigger>
        <MenubarContent className="ml-1">
          <MenubarSub>
            <MenubarSubTrigger className="px-2 py-1 font-normal transition-colors hover:bg-accent hover:text-accent-foreground">
              File
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={actions.openLocal}>
                Open Local File
              </MenubarItem>
              <MenubarItem onSelect={actions.openGitHub}>
                Open GitHub File
              </MenubarItem>
              <MenubarItem onSelect={actions.saveLocal}>
                Save to local
              </MenubarItem>
              <MenubarItem onSelect={actions.saveGitHub}>
                Save to GitHub
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={actions.settings}>Settings</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={actions.leaveRoom}>Leave Room</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger className="px-2 py-1 font-normal">
              Edit
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={actions.undo}>Undo</MenubarItem>
              <MenubarItem onSelect={actions.redo}>Redo</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={actions.cut}>Cut</MenubarItem>
              <MenubarItem onSelect={actions.copy}>Copy</MenubarItem>
              <MenubarItem onSelect={actions.paste}>Paste</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={actions.find}>Find</MenubarItem>
              <MenubarItem onSelect={actions.replace}>Replace</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger className="px-2 py-1 font-normal">
              Selection
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={actions.selectAll}>Select All</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={actions.copyLineUp}>
                Copy Line Up
              </MenubarItem>
              <MenubarItem onSelect={actions.copyLineDown}>
                Copy Line Down
              </MenubarItem>
              <MenubarItem onSelect={actions.moveLineUp}>
                Move Line Up
              </MenubarItem>
              <MenubarItem onSelect={actions.moveLineDown}>
                Move Line Down
              </MenubarItem>
              <MenubarItem onSelect={actions.duplicateSelection}>
                Duplicate Selection
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={actions.addCursorAbove}>
                Add Cursor Above
              </MenubarItem>
              <MenubarItem onSelect={actions.addCursorBelow}>
                Add Cursor Below
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger className="px-2 py-1 font-normal">
              View
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={actions.commandPalette}>
                Command Palette
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
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger className="px-2 py-1 font-normal">
              Help
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={actions.manual}>Manual</MenubarItem>
              <MenubarItem onSelect={actions.about}>About</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export { MobileMenu };

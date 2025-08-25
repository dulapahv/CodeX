/**
 * Desktop menubar component that provides keyboard shortcuts and actions.
 * Features:
 * - Menu categories with keyboard shortcuts
 * - Panel toggle actions
 * - Editor command bindings
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useEffect, useRef } from 'react';

import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';

import { createMenuConfig } from '../menu-config';
import type { MenuProps } from '../types';
import { SharedMenuItem } from './shared-menu-item';

const DesktopMenu = ({
  modKey,
  actions,
  notepad,
  terminal,
  webcam,
  livePreview,
}: MenuProps) => {
  const menuConfig = createMenuConfig(
    modKey,
    notepad,
    terminal,
    webcam,
    livePreview,
  );

  const menubarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        menubarRef.current?.focus();
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  return (
    <Menubar
      className="hidden h-fit border-none bg-transparent p-0 md:flex"
      ref={menubarRef}
    >
      {menuConfig.map((group) => (
        <MenubarMenu key={group.label}>
          <MenubarTrigger
            className="hover:bg-accent hover:text-accent-foreground px-2 py-1 font-normal
              transition-colors"
          >
            {group.label}
          </MenubarTrigger>
          <MenubarContent className="ml-1" loop>
            {group.items.map((item, index) => (
              <SharedMenuItem
                key={typeof item === 'string' ? `sep-${index}` : item.label}
                item={item}
                actions={actions}
              />
            ))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  );
};

export { DesktopMenu };

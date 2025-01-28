/**
 * Mobile menubar component that provides collapsible menu access.
 * Features:
 * - Collapsible menu navigation
 * - Panel toggle actions
 * - Editor command access
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useEffect, useRef } from 'react';

import { Menu } from 'lucide-react';

import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';

import { createMenuConfig } from '../menu-config';
import type { MenuProps } from '../types';
import { SharedMenuItem } from './shared-menu-item';

const MobileMenu = ({
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
      className="animate-fade-in flex h-fit border-none bg-transparent p-0 md:hidden"
      ref={menubarRef}
    >
      <MenubarMenu>
        <MenubarTrigger className="px-2 py-1" aria-label="Open menu">
          <Menu className="size-5" />
        </MenubarTrigger>
        <MenubarContent className="ml-1">
          {menuConfig.map((group) => (
            <MenubarSub key={group.label}>
              <MenubarSubTrigger className="px-2 py-1 font-normal">
                {group.label}
              </MenubarSubTrigger>
              <MenubarSubContent>
                {group.items.map((item, index) => (
                  <SharedMenuItem
                    key={typeof item === 'string' ? `sep-${index}` : item.label}
                    item={item}
                    actions={actions}
                  />
                ))}
              </MenubarSubContent>
            </MenubarSub>
          ))}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export { MobileMenu };

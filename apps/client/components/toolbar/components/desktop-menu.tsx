/**
 * Desktop menubar component that provides keyboard shortcuts and actions.
 * Features:
 * - Menu categories with keyboard shortcuts
 * - Panel toggle actions
 * - Editor command bindings
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useEffect, useRef } from "react";

import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

import { useDeferredMenuAction } from "../hooks/use-deferred-menu-action";
import { createMenuConfig } from "../menu-config";
import type { MenuProps } from "../types";
import { SharedMenuItem } from "./shared-menu-item";

const DesktopMenu = ({
  platform,
  actions,
  notepad,
  terminal,
  webcam,
  livePreview,
}: MenuProps) => {
  const menuConfig = createMenuConfig(
    platform,
    notepad,
    terminal,
    webcam,
    livePreview
  );

  const { restoreFocus, runPendingAction, selectAction } =
    useDeferredMenuAction(actions);

  const menubarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        menubarRef.current?.focus();
      }
    };

    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, []);

  return (
    <Menubar
      className="hidden h-fit border-none bg-transparent p-0 md:flex"
      ref={menubarRef}
    >
      {menuConfig.map((group) => (
        <MenubarMenu
          key={group.label}
          loopFocus
          onOpenChangeComplete={runPendingAction}
        >
          <MenubarTrigger className="hover:bg-accent hover:text-accent-foreground px-2 py-1 font-normal transition-colors">
            {group.label}
          </MenubarTrigger>
          <MenubarContent className="ml-1 w-auto" finalFocus={restoreFocus}>
            {group.items.map((item, index) => (
              <SharedMenuItem
                actions={actions}
                item={item}
                key={typeof item === "string" ? `sep-${index}` : item.label}
                onSelect={selectAction}
              />
            ))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  );
};

export { DesktopMenu };

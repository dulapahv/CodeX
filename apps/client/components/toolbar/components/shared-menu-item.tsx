/**
 * Shared menu item component used in both desktop and mobile menu toolbars.
 * Features:
 * - Regular menu items
 * - Checkbox menu items
 * - Menu separators
 * - Keyboard shortcuts
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  MenubarCheckboxItem,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from "@/components/ui/menubar";

import type { MenuItem } from "../menu-config";
import type { ToolbarActions } from "../types";

interface SharedMenuItemProps {
  actions: ToolbarActions;
  hideShortcut?: boolean;
  item: MenuItem | "separator";
  /** Runs an item's action once its menu has closed */
  onSelect: (action: keyof ToolbarActions) => void;
}

export const SharedMenuItem = ({
  item,
  actions,
  onSelect,
  hideShortcut,
}: SharedMenuItemProps) => {
  if (item === "separator") {
    return <MenubarSeparator />;
  }

  // Panel toggles don't need the editor's focus, so they run straight away
  if (item.type === "checkbox") {
    return (
      <MenubarCheckboxItem
        checked={item.checked}
        closeOnClick
        onCheckedChange={() => actions[item.action]()}
      >
        {item.icon}
        {item.label}
      </MenubarCheckboxItem>
    );
  }

  return (
    <MenubarItem onClick={() => onSelect(item.action)}>
      {item.icon}
      {item.label}
      {!hideShortcut && item.shortcut && (
        <MenubarShortcut className="pl-2 max-[486px]:hidden">
          {item.shortcut}
        </MenubarShortcut>
      )}
    </MenubarItem>
  );
};

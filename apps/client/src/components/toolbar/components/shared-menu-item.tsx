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
} from '@/components/ui/menubar';

import type { MenuItem } from '../menu-config';
import type { ToolbarActions } from '../types';

interface SharedMenuItemProps {
  item: MenuItem | 'separator';
  actions: ToolbarActions;
  hideShortcut?: boolean;
}

export const SharedMenuItem = ({
  item,
  actions,
  hideShortcut,
}: SharedMenuItemProps) => {
  if (item === 'separator') {
    return <MenubarSeparator />;
  }

  if (item.type === 'checkbox') {
    return (
      <MenubarCheckboxItem
        checked={item.checked}
        onCheckedChange={() => actions[item.action]()}
      >
        {item.icon}
        {item.label}
      </MenubarCheckboxItem>
    );
  }

  return (
    <MenubarItem onSelect={() => actions[item.action]()}>
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

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
  mobile?: boolean;
}

export const SharedMenuItem = ({
  item,
  actions,
  mobile,
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
      {!mobile && item.shortcut && (
        <MenubarShortcut className="pl-2">{item.shortcut}</MenubarShortcut>
      )}
    </MenubarItem>
  );
};

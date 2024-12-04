import { useState } from 'react';
import { Check, Navigation, NavigationOff } from 'lucide-react';
import { isMobile } from 'react-device-detect';

import type { User } from '@common/types/user';

import { storage } from '@/lib/services/storage';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UserListProps {
  users: User[];
}

const FollowUser = ({ users }: UserListProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(storage.getFollowUserId());

  const currentUserId = storage.getUserId();
  const filteredUsers = users.filter((user) => user.id !== currentUserId);

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === 'none' ? null : currentValue;
    setValue(newValue);
    storage.setFollowUserId(newValue);
    setOpen(false);
  };

  const getTooltipText = () => {
    if (value === null) {
      return 'Not following anyone';
    }
    const followedUser = users.find((user) => user.id === value);
    return followedUser
      ? `Following ${followedUser.username}`
      : 'Not following anyone';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 animate-fade-in-top rounded-sm p-0"
              aria-label="Follow user"
            >
              {value === null ? (
                <NavigationOff className="size-4 text-[color:var(--panel-text)]" />
              ) : (
                <Navigation className="size-4 text-[color:var(--panel-text)]" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{getTooltipText()}</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="mr-1 w-64 p-0"
        sideOffset={8}
        onOpenAutoFocus={(event) => {
          if (isMobile) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <Command>
          <Label className="px-3 pt-3 text-sm font-medium">Follow user</Label>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty className="p-3 text-sm text-muted-foreground">
              No users found.
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={handleSelect}
                className="flex h-9 items-center justify-between px-2 py-1.5"
              >
                <span className="truncate text-ellipsis">
                  Don&apos;t follow anyone
                </span>
                {value === null && <Check className="size-4 flex-shrink-0" />}
              </CommandItem>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={handleSelect}
                  className="flex items-center justify-between px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      user={user}
                      size="sm"
                      showTooltip={false}
                      animate={false}
                    />
                    <span className="max-w-44 truncate text-ellipsis">
                      {user.username}
                    </span>
                  </div>
                  {value === user.id && (
                    <Check className="size-4 flex-shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { FollowUser };

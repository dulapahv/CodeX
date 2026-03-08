/**
 * Follow user component that enables cursor/scroll following functionality.
 * Features:
 * - User selection dropdown
 * - Follow mode toggle
 * - Active follower indicator
 * - Mobile support
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { User } from "@codex/types/user";

import { Check, Navigation, NavigationOff } from "lucide-react";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { storage } from "@/lib/services/storage";

interface UserListProps {
  users: User[];
}

const FollowUser = ({ users }: UserListProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(storage.getFollowUserId());

  const currentUserId = storage.getUserId();
  const filteredUsers = users.filter((user) => user.id !== currentUserId);

  useEffect(() => {
    const followedUserId = storage.getFollowUserId();
    if (followedUserId) {
      const isUserStillPresent = users.some(
        (user) => user.id === followedUserId
      );
      if (!isUserStillPresent) {
        setValue(null);
        storage.setFollowUserId(null);
      }
    }
  }, [users]);

  const handleSelect = (currentValue: string) => {
    const newVal = currentValue.split("$")[0];
    const newValue = newVal === "none" ? null : newVal;
    setValue(newValue);
    storage.setFollowUserId(newValue);
    setOpen(false);
  };

  const getTooltipText = () => {
    if (value === null) {
      return "Not following anyone";
    }
    const followedUser = users.find((user) => user.id === value);
    return followedUser
      ? `Following ${followedUser.username}`
      : "Not following anyone";
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              aria-label="Follow user"
              className="size-7 animate-fade-in-top rounded-sm p-0"
              size="icon"
              variant="ghost"
            >
              {value === null ? (
                <NavigationOff className="size-4 text-[color:var(--panel-text)]" />
              ) : (
                <Navigation className="size-4 animate-pulse fill-[#f6d84f] text-[#f6d84f]" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{getTooltipText()}</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="mr-1 w-64 p-0"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onOpenAutoFocus={(event) => {
          if (isMobile) {
            event.preventDefault();
          }
        }}
        sideOffset={8}
      >
        <Command>
          <Label className="px-3 pt-3 font-medium text-sm">Follow user</Label>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty className="p-3 text-muted-foreground text-sm">
              No users found.
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                className="flex h-9 items-center justify-between px-2 py-1.5"
                onSelect={handleSelect}
                value="none"
              >
                <span className="max-w-44 truncate text-ellipsis">
                  Don&apos;t follow anyone
                </span>
                {value === null && <Check className="size-4 flex-shrink-0" />}
              </CommandItem>
              {filteredUsers.map((user) => (
                <CommandItem
                  className="flex items-center justify-between px-2 py-1.5"
                  key={user.id}
                  onSelect={handleSelect}
                  value={`${user.id}$${user.username}`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      animate={false}
                      showTooltip={false}
                      size="sm"
                      user={user}
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

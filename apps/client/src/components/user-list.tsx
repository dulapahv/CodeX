/**
 * UserList component that displays a horizontal scrollable list of user avatars.
 * Uses theme-aware styling for the scroll bar.
 *
 * @component
 * @example
 * ```tsx
 * <UserList users={[
 *   { id: "123", name: "Dulapah Vibulsanti" },
 *   { id: "456", name: "Kantinan Saengprachathanarak" }
 * ]} />
 * ```
 *
 * @param props - Component props
 * @param props.users - Array of user objects to display
 *
 * @remarks
 * Uses the following components:
 * - [`Avatar`](src/components/avatar/index.tsx) for user avatars
 * - [`ScrollArea`](src/components/ui/scroll-area.tsx) for horizontal scrolling
 * - [`ScrollBar`](src/components/ui/scroll-area.tsx) for scroll indicator
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useTheme } from 'next-themes';

import type { User } from '@kasca/types/user';

import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/avatar';

interface UserListProps {
  users: User[];
}

const UserList = ({ users }: UserListProps) => {
  const { resolvedTheme } = useTheme();
  const totalUsers = users.length;

  return (
    <div role="region" aria-label="Active users">
      <ScrollArea
        className="max-w-16 sm:max-w-28 lg:max-w-52"
        aria-label={`${totalUsers} active users in this session`}
      >
        <div className="flex -space-x-2" role="list">
          {users.map((user) => (
            <div key={user.id} role="listitem">
              <Avatar key={user.id} user={user} />
            </div>
          ))}
        </div>
        <ScrollBar
          orientation="horizontal"
          color="white"
          className={cn(
            'h-1.5',
            resolvedTheme === 'dark'
              ? '[&>div]:bg-foreground'
              : '[&>div]:bg-primary',
          )}
          aria-orientation="horizontal"
          aria-label="Scroll through user avatars"
        />
      </ScrollArea>
    </div>
  );
};

export { UserList };

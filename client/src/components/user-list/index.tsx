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

import type { User } from '@common/types/user';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface UserListProps {
  users: User[];
}

const UserList = ({ users }: UserListProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <ScrollArea className="max-w-52">
      <div className="flex -space-x-2">
        {users.map((user) => (
          <Avatar key={user.id} user={user} />
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
      />
    </ScrollArea>
  );
};

export { UserList };

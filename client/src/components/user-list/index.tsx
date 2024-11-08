import { useTheme } from 'next-themes';

import type { User } from '@common/types/user';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
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
}

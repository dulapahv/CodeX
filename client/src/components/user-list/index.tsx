import { useTheme } from "next-themes";

import { Avatar } from "@/components/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { storage } from "@/lib/services/storage";
import { cn } from "@/lib/utils";

import type { User } from "../../../../common/types/user";

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  const { resolvedTheme } = useTheme();
  const currentUserId = storage.getUserId();

  const getDisplayName = (user: User) => {
    return user.id === currentUserId ? `${user.username} (you)` : user.username;
  };

  return (
    <ScrollArea className="max-w-52">
      <div className="flex -space-x-2">
        {users.map((user) => (
          <Avatar key={user.id} name={getDisplayName(user)} />
        ))}
      </div>
      <ScrollBar
        orientation="horizontal"
        color="white"
        className={cn(
          "h-1.5",
          resolvedTheme === "dark"
            ? "[&>div]:bg-foreground"
            : "[&>div]:bg-primary",
        )}
      />
    </ScrollArea>
  );
}

/**
 * User list component that displays active room participants.
 * Features:
 * - Avatar stack display
 * - Scrollable interface
 * - Accessible markup
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { User } from "@codex/types/user";
import { useTheme } from "next-themes";
import { Avatar } from "@/components/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface UserListProps {
  users: User[];
}

const UserList = ({ users }: UserListProps) => {
  const { resolvedTheme } = useTheme();
  const totalUsers = users.length;

  return (
    <section aria-label="Active users">
      <ScrollArea
        aria-label={`${totalUsers} active users in this session`}
        className="max-w-8 sm:max-w-28 lg:max-w-52 min-[375px]:max-w-16"
      >
        <ul className="flex -space-x-2">
          {users.map((user) => (
            <li key={user.id}>
              <Avatar key={user.id} user={user} />
            </li>
          ))}
        </ul>
        <ScrollBar
          aria-label="Scroll through user avatars"
          aria-orientation="horizontal"
          className={cn(
            "h-1.5",
            resolvedTheme === "dark"
              ? "[&>div]:bg-foreground"
              : "[&>div]:bg-primary"
          )}
          color="white"
          orientation="horizontal"
        />
      </ScrollArea>
    </section>
  );
};

export { UserList };

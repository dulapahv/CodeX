import { useTheme } from "next-themes";

import { Avatar } from "@/components/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface UserListProps {
  users: string[];
}

export function UserList({ users }: UserListProps) {
  const { resolvedTheme } = useTheme();

  return (
    <ScrollArea className="max-w-52">
      <div className="flex -space-x-2">
        {users.map((user, index) => (
          <Avatar key={index} name={user} />
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

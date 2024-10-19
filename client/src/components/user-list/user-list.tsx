import { Avatar } from "@/components/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface UserListProps {
  users: string[];
}

export function UserList({ users }: UserListProps) {
  return (
    <ScrollArea>
      <div className="mr-2 flex justify-end gap-x-2">
        {users.map((user, index) => (
          <Avatar key={index} name={user} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

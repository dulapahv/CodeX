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
import { Avatar } from "@/components/avatar";

interface UserListProps {
  users: User[];
}

const UserList = ({ users }: UserListProps) => (
  <section aria-label="Active users">
    {/* biome-ignore lint/a11y/useSemanticElements: labelled group of avatars, not a fieldset */}
    <div
      aria-label={`${users.length} active users in this session`}
      className="max-w-8 overflow-x-auto overflow-y-hidden sm:max-w-28 lg:max-w-52 min-[375px]:max-w-16"
      role="group"
    >
      <ul className="flex -space-x-2">
        {users.map((user) => (
          <li key={user.id}>
            <Avatar user={user} />
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export { UserList };

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { COLORS } from "@/lib/constants";
import { storage } from "@/lib/services/storage";
import { cn, hashString } from "@/lib/utils";

import type { User } from "../../../../common/types/user";

interface AvatarProps {
  readonly user: User;
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
  readonly showTooltip?: boolean;
}

/**
 * Generates initials from a name
 * @param name - Full name
 * @returns Two-letter initials
 */
const getInitials = (name: string): string => {
  const [firstName, secondName = ""] = name.trim().split(/\s+/);
  const firstInitial = firstName?.[0] ?? "";
  const secondInitial = secondName?.[0] ?? firstName?.[1] ?? "";
  return (firstInitial + secondInitial).toUpperCase();
};

/**
 * Gets background color based on name
 * @param name - User's name
 * @returns Hex color code
 */
const getBackgroundColor = (name: string): string => {
  const colorIndex = hashString(name) % COLORS.length;
  return COLORS[colorIndex];
};

/**
 * Gets display name with "you" suffix
 * @param user - User object
 * @param currentUserId - Current user's ID
 * @returns Display name
 */
const getDisplayName = (user: User, currentUserId: string) => {
  return user.id === currentUserId ? `${user.username} (you)` : user.username;
};

const sizeClasses = {
  sm: "size-6 text-xs",
  md: "size-7 text-sm",
  lg: "size-8 text-base",
} as const;

export function Avatar({
  user,
  size = "md",
  className,
  showTooltip = true,
}: AvatarProps) {
  const initials = getInitials(user.username);
  const backgroundColor = getBackgroundColor(user.username);
  const currentUserId = storage.getUserId() ?? "";

  const AvatarContent = (
    <div
      className={cn(
        "flex cursor-default items-center justify-center rounded-full border-[1.5px] border-white/50 font-medium text-[#fff] dark:border-black/50",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor }}
      data-testid="avatar"
    >
      {initials}
    </div>
  );

  if (!showTooltip) {
    return AvatarContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{AvatarContent}</TooltipTrigger>
      <TooltipContent>{getDisplayName(user, currentUserId)}</TooltipContent>
    </Tooltip>
  );
}

// Add prop types export for documentation
export type { AvatarProps };

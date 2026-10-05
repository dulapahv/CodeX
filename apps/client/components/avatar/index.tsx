/**
 * Avatar component that displays user initials with custom styling.
 * Features:
 * - Responsive sizing options
 * - Tooltip/Popover for user names
 * - Animated scaling
 * - Device-specific interaction
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { User } from "@codex/types/user";
import { isMobile } from "react-device-detect";
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
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { cn, getBackgroundColor, getTextColor } from "@/lib/utils";

import { getDisplayName, getInitials } from "./utils";

interface AvatarProps {
  readonly animate?: boolean;
  readonly className?: string;
  readonly showTooltip?: boolean;
  readonly size?: "sm" | "md" | "lg";
  readonly user: User;
}

const sizeClasses = {
  sm: "size-6 text-xs",
  md: "size-7 text-sm",
  lg: "size-12 text-lg",
};

const Avatar = ({
  user,
  size = "md",
  className,
  showTooltip = true,
  animate = true,
}: AvatarProps) => {
  const initials = getInitials(user.username);
  const backgroundColor = getBackgroundColor(user.username);
  const colors = { backgroundColor, color: getTextColor(backgroundColor) };
  const currentUserId = useCurrentUserId() ?? "";
  const displayName = getDisplayName(user, currentUserId);

  const AvatarContent = (
    <div
      aria-label={displayName}
      className={cn(
        "flex cursor-default items-center justify-center rounded-full border-[1.5px] border-white/50 font-medium text-[#fff] dark:border-black/50",
        animate && "animate-scale-up-center",
        sizeClasses[size],
        className
      )}
      data-testid="avatar"
      role="img"
      style={colors}
    >
      <span aria-hidden="true">{initials}</span>
    </div>
  );

  if (!showTooltip) {
    return AvatarContent;
  }

  // Use Popover for mobile devices and Tooltip for desktop
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger
          aria-label={`${displayName}'s avatar`}
          nativeButton={false}
          render={AvatarContent}
        />
        <PopoverContent
          className="w-fit max-w-xs bg-foreground px-3 py-1.5 text-background shadow-none ring-0"
          role="tooltip"
          side="top"
          sideOffset={8}
        >
          {displayName}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`${displayName}'s avatar`}
        delay={0}
        render={AvatarContent}
      />
      <TooltipContent role="tooltip" sideOffset={8}>
        {displayName}
      </TooltipContent>
    </Tooltip>
  );
};

export { Avatar };

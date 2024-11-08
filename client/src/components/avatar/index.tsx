import type { User } from '@common/types/user';

import { storage } from '@/lib/services/storage';
import { userMap } from '@/lib/services/user-map';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AvatarProps {
  readonly user: User;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
  readonly showTooltip?: boolean;
}

/**
 * Generates initials from a name
 * @param name - Full name
 * @returns Two-letter initials
 */
const getInitials = (name: string): string => {
  const [firstName, secondName = ''] = name.trim().split(/\s+/);
  const firstInitial = firstName?.[0] ?? '';
  const secondInitial = secondName?.[0] ?? firstName?.[1] ?? '';
  return (firstInitial + secondInitial).toUpperCase();
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
  sm: 'size-6 text-xs',
  md: 'size-7 text-sm',
  lg: 'size-8 text-base',
} as const;

export function Avatar({
  user,
  size = 'md',
  className,
  showTooltip = true,
}: AvatarProps) {
  const initials = getInitials(user.username);
  const colors = userMap.getColors(user.id);
  const currentUserId = storage.getUserId() ?? '';

  const AvatarContent = (
    <div
      className={cn(
        'flex animate-scale-up-center cursor-default items-center justify-center rounded-full border-[1.5px] border-white/50 font-medium text-[#fff] dark:border-black/50',
        sizeClasses[size],
        className,
      )}
      style={colors}
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

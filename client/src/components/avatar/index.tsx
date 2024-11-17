/**
 * Avatar component that displays user initials in a colored circle.
 * Supports different sizes and optional tooltips.
 *
 * @example
 * ```tsx
 * <Avatar
 *   user={{ id: "123", name: "John Doe" }}
 *   size="md"
 *   showTooltip={true}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.user - User object with name and id
 * @param props.size - Size of avatar: 'sm' | 'md' | 'lg' (default: 'md')
 * @param props.className - Additional CSS classes
 * @param props.showTooltip - Whether to show name tooltip on hover
 *
 * @remarks
 * Uses [`userMap`](src/lib/services/user-map.ts) to get current user ID and
 * [`storage`](src/lib/services/storage.ts) for user preferences.
 * Tooltip content is rendered using [`TooltipProvider`]
 * (src/components/ui/tooltip.tsx).
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { User } from '@common/types/user';

import { storage } from '@/lib/services/storage';
import { userMap } from '@/lib/services/user-map';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { getDisplayName, getInitials } from './utils';

interface AvatarProps {
  readonly user: User;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
  readonly showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'size-6 text-xs',
  md: 'size-7 text-sm',
  lg: 'size-8 text-base',
};

const Avatar = ({
  user,
  size = 'md',
  className,
  showTooltip = true,
}: AvatarProps) => {
  const initials = getInitials(user.username);
  const colors = userMap.getColors(user.id);
  const currentUserId = storage.getUserId() ?? '';
  const displayName = getDisplayName(user, currentUserId);

  const AvatarContent = (
    <div
      className={cn(
        'flex animate-scale-up-center cursor-default items-center justify-center rounded-full border-[1.5px] border-white/50 font-medium text-[#fff] dark:border-black/50',
        sizeClasses[size],
        className,
      )}
      style={colors}
      data-testid="avatar"
      role="img"
      aria-label={displayName}
      tabIndex={0}
    >
      <span aria-hidden="true">{initials}</span>
    </div>
  );

  if (!showTooltip) {
    return AvatarContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild aria-label={`${displayName}'s avatar`}>
        {AvatarContent}
      </TooltipTrigger>
      <TooltipContent role="tooltip">{displayName}</TooltipContent>
    </Tooltip>
  );
};

export { Avatar };

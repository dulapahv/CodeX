import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { COLORS } from "@/lib/constants";
import { cn, hashString } from "@/lib/utils";

interface AvatarProps {
  readonly name: string;
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

const sizeClasses = {
  sm: "size-6 text-xs",
  md: "size-7 text-sm",
  lg: "size-8 text-base",
} as const;

export function Avatar({
  name,
  size = "md",
  className,
  showTooltip = true,
}: AvatarProps) {
  const initials = getInitials(name);
  const backgroundColor = getBackgroundColor(name);

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
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

// Add prop types export for documentation
export type { AvatarProps };

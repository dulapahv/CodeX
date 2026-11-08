/**
 * Icon button with a tooltip naming its action and shortcut, used across the
 * notepad toolbars.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps extends ComponentProps<typeof Button> {
  label: string;
  pressed?: boolean;
  shortcut?: string;
}

const ToolbarButton = ({
  children,
  className,
  label,
  pressed,
  shortcut,
  ...props
}: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          aria-label={label}
          aria-pressed={pressed}
          className={cn(
            "hover:bg-foreground/10 aria-pressed:bg-foreground/15 text-inherit",
            className
          )}
          size="icon-sm"
          variant="ghost"
          {...props}
        >
          {children}
        </Button>
      }
    />
    <TooltipContent>
      {shortcut ? `${label} (${shortcut})` : label}
    </TooltipContent>
  </Tooltip>
);

export { ToolbarButton };

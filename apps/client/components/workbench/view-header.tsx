/**
 * The title row of a side bar view or panel, with small icon actions on the
 * right, styled after VS Code's.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface WorkbenchActionProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  isPressed?: boolean;
  label: string;
  onClick: () => void;
  shortcut?: string;
}

export const WorkbenchAction = ({
  children,
  className,
  disabled,
  isPressed,
  label,
  onClick,
  shortcut,
}: WorkbenchActionProps) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          aria-label={label}
          aria-pressed={isPressed}
          className={cn(
            "text-wb-fg hover:bg-wb-hover hover:text-wb-fg aria-expanded:bg-wb-active size-6 [&_svg:not([class*='size-'])]:size-4",
            className
          )}
          disabled={disabled}
          onClick={onClick}
          size="icon"
          variant="ghost"
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

interface ViewHeaderProps {
  children?: ReactNode;
  className?: string;
  id?: string;
  title: string;
}

export const ViewHeader = ({
  children,
  className,
  id,
  title,
}: ViewHeaderProps) => (
  <div
    className={cn(
      "flex h-9 shrink-0 items-center justify-between gap-2 pr-2 pl-5",
      className
    )}
  >
    <h2
      className="text-wb-fg truncate text-[11px] font-normal tracking-wide uppercase"
      id={id}
    >
      {title}
    </h2>
    {children && <div className="flex items-center gap-0.5">{children}</div>}
  </div>
);

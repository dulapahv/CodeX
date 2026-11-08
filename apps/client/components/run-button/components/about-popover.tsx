/**
 * About popover component for code execution information.
 * Features:
 * - Execution details popover
 * - Accessible tooltip
 * - Animated icon button
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { InfoIcon, WarningIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AboutPopover = () => (
  <Popover>
    <Tooltip>
      <PopoverTrigger
        render={
          <TooltipTrigger
            render={
              <Button
                className="animate-fade-in-top size-7 p-0 hover:bg-transparent [&>svg]:transition-opacity [&>svg]:hover:opacity-70"
                size="icon"
                variant="ghost"
              >
                <InfoIcon className="size-4 text-[color:var(--panel-text)]" />
                <span className="sr-only">About code execution</span>
              </Button>
            }
          />
        }
      />
      <TooltipContent>
        <p>About code execution</p>
      </TooltipContent>
    </Tooltip>
    <PopoverContent className="w-[340px]" sideOffset={8}>
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Code Execution</h4>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              Use the dropdown menu to add command-line arguments and input to
              your program.
            </p>
            <p>
              You can cancel execution at any time by clicking the stop button.
            </p>
            <p>
              For a list of supported programming languages, refer to the{" "}
              <a
                className="text-foreground hover:text-muted-foreground font-medium underline underline-offset-4 !transition-all"
                href="https://github.com/dulapahv/CodeX/blob/main/manual.md#supported-execution-languages"
                rel="noopener noreferrer"
                target="_blank"
              >
                manual
              </a>
              .
            </p>
            <p className="flex items-center gap-1.5">
              <WarningIcon aria-hidden="true" className="size-4 shrink-0" />
              Rate limited to 5 requests per second
            </p>
          </div>
        </div>

        <Separator />

        <div className="text-muted-foreground text-xs">
          <p>
            Powered by{" "}
            <a
              className="text-foreground hover:text-muted-foreground font-medium underline underline-offset-2 !transition-all"
              href="https://github.com/engineer-man/piston"
              rel="noopener noreferrer"
              target="_blank"
            >
              Piston
            </a>
          </p>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);

export { AboutPopover };

/**
 * About popover component for code execution information.
 * Features:
 * - Execution details popover
 * - Accessible tooltip
 * - Animated icon button
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Info } from "lucide-react";

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
      <PopoverTrigger asChild>
        <TooltipTrigger asChild>
          <Button
            className="size-7 animate-fade-in-top rounded-sm p-0 hover:bg-transparent [&>svg]:transition-opacity hover:[&>svg]:opacity-70"
            size="icon"
            variant="ghost"
          >
            <Info className="size-4 text-[color:var(--panel-text)]" />
            <span className="sr-only">About code execution</span>
          </Button>
        </TooltipTrigger>
      </PopoverTrigger>
      <TooltipContent>
        <p>About code execution</p>
      </TooltipContent>
    </Tooltip>
    <PopoverContent className="w-[340px]" sideOffset={8}>
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Code Execution</h4>
          <div className="space-y-2 text-muted-foreground text-sm">
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
                className="!transition-all font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
                href="https://github.com/dulapahv/CodeX/blob/main/manual.md#supported-execution-languages"
                rel="noopener noreferrer"
                target="_blank"
              >
                manual
              </a>
              .
            </p>
            <p>⚠️ Rate limited to 5 requests per second</p>
          </div>
        </div>

        <Separator />

        <div className="text-muted-foreground text-xs">
          <p>
            Powered by{" "}
            <a
              className="!transition-all font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
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

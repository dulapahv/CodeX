/**
 * Help popover component for live preview functionality.
 * Features:
 * - Usage instructions
 * - Pre-installed libraries list
 * - External links
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PRE_INSTALLED_LIBS } from "@/lib/constants";

const HelpPopover = () => (
  <Popover>
    <Tooltip>
      <PopoverTrigger asChild>
        <TooltipTrigger asChild>
          <Button
            className="size-7 rounded-full border-border bg-muted p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            size="icon"
          >
            <CircleHelp className="size-4" />
            <span className="sr-only">Help with live preview</span>
          </Button>
        </TooltipTrigger>
      </PopoverTrigger>
      <TooltipContent>
        <p>Help with live preview</p>
      </TooltipContent>
    </Tooltip>
    <PopoverContent className="mr-1 w-96 overflow-auto [@media(max-height:800px)]:max-h-96">
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Live Preview</h4>
          <div className="space-y-4 text-muted-foreground text-sm">
            <div>
              <h5 className="mb-2 font-medium">Usage Instructions</h5>
              <ul className="list-inside list-disc space-y-1">
                <li>Only HTML code is supported</li>
                <li>Tailwind CSS utility classes are available</li>
                <li>
                  Add custom styles with{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    &lt;style&gt;
                  </code>{" "}
                  tags
                </li>
                <li>
                  Add custom scripts with{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    &lt;script&gt;
                  </code>{" "}
                  tags
                </li>
                <li>
                  Add external libraries in{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    &lt;head&gt;
                  </code>{" "}
                  tags
                </li>
                <li>
                  <a
                    className="!transition-all inline-flex items-center gap-1 text-foreground underline underline-offset-2 hover:text-muted-foreground"
                    href="https://github.com/dulapahv/CodeX/blob/main/manual.md#live-preview-example"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    See live preview examples
                    <span className="sr-only">(opens in new tab)</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="mb-2 font-medium">Pre-installed Libraries</h5>
              <div className="overflow-y-auto rounded border border-border p-2">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {PRE_INSTALLED_LIBS.map((lib) => (
                    <li
                      className="flex items-center justify-between"
                      key={lib.name}
                    >
                      <span>{lib.name}</span>
                      <span className="text-muted-foreground text-xs">
                        v{lib.version}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="text-muted-foreground text-xs">
          <p>Preview renders HTML with CDN-loaded libraries</p>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);

export { HelpPopover };

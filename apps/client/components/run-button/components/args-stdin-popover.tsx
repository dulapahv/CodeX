/**
 * Arguments and stdin input popover for code execution.
 * Features:
 * - Program arguments input
 * - Standard input handling
 * - Input validation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ExecutionArgsProps {
  disabled?: boolean;
  onArgsChange: (args: string[]) => void;
  onStdinChange: (stdin: string) => void;
}

const ArgsInputPopover = ({
  onArgsChange,
  onStdinChange,
  disabled,
}: ExecutionArgsProps) => {
  const [argsStr, setArgsStr] = useState("");
  const [stdin, setStdin] = useState("");
  const [open, setOpen] = useState(false);

  const handleArgsChange = (value: string) => {
    setArgsStr(value);
    const args = value.split("\n").filter((arg) => arg.trim());
    onArgsChange(args);
  };

  const handleStdinChange = (value: string) => {
    setStdin(value);
    onStdinChange(value);
  };

  const clearArgs = () => {
    handleArgsChange("");
  };

  const clearStdin = () => {
    handleStdinChange("");
  };

  const hasInput = argsStr || stdin;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              aria-label="Program arguments and input"
              className={cn(
                "hover:!opacity-80 disabled:!opacity-50 relative size-7 rounded-l-none border-l border-l-[color:var(--panel-text-accent)] bg-[color:var(--toolbar-accent)] text-[color:var(--panel-text-accent)] transition-opacity hover:bg-[color:var(--toolbar-accent)] hover:text-[color:var(--panel-text-accent)]",
                disabled && "bg-red-600"
              )}
              disabled={disabled}
              size="icon"
              variant="ghost"
            >
              <ChevronDown className="size-4" />
              {hasInput && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 size-2 animate-scale-up-center rounded-full bg-red-500"
                />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>
          {hasInput ? (
            <div className="space-y-1">
              {argsStr && <div>Has program arguments</div>}
              {stdin && <div>Has program input</div>}
            </div>
          ) : (
            "Add program arguments and input"
          )}
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-80 p-4" sideOffset={8}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="args-input">Program Arguments</Label>
            <div className="relative">
              <Textarea
                className="max-h-[30vh] min-h-[10vh] resize-y pr-8 text-sm"
                id="args-input"
                onChange={(e) => handleArgsChange(e.target.value)}
                placeholder="Enter each argument on a new line..."
                value={argsStr}
              />
              {argsStr && (
                <Button
                  aria-label="Clear arguments"
                  className="absolute top-1 right-1 size-6 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={clearArgs}
                  size="icon"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stdin-input">Program Input (stdin)</Label>
            <div className="relative">
              <Textarea
                className="max-h-[30vh] min-h-[10vh] resize-y pr-8 text-sm"
                id="stdin-input"
                onChange={(e) => handleStdinChange(e.target.value)}
                placeholder="Enter each input on a new line..."
                value={stdin}
              />
              {stdin && (
                <Button
                  aria-label="Clear program input"
                  className="absolute top-1 right-1 size-6 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={clearStdin}
                  size="icon"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="text-muted-foreground text-xs">
            <p className="font-medium">Example:</p>
            <ul className="font-mono">
              <li>input1</li>
              <li>42 Bangkok</li>
              <li>1 2 3</li>
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { ArgsInputPopover };

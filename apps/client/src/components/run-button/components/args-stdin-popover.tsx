/**
 * Arguments and stdin input popover for code execution.
 * Features:
 * - Program arguments input
 * - Standard input handling
 * - Input validation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useState } from 'react';

import { ChevronDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExecutionArgsProps {
  onArgsChange: (args: string[]) => void;
  onStdinChange: (stdin: string) => void;
  disabled?: boolean;
}

const ArgsInputPopover = ({
  onArgsChange,
  onStdinChange,
  disabled,
}: ExecutionArgsProps) => {
  const [argsStr, setArgsStr] = useState('');
  const [stdin, setStdin] = useState('');
  const [open, setOpen] = useState(false);

  const handleArgsChange = (value: string) => {
    setArgsStr(value);
    const args = value.split('\n').filter((arg) => arg.trim());
    onArgsChange(args);
  };

  const handleStdinChange = (value: string) => {
    setStdin(value);
    onStdinChange(value);
  };

  const clearArgs = () => {
    handleArgsChange('');
  };

  const clearStdin = () => {
    handleStdinChange('');
  };

  const hasInput = argsStr || stdin;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                `relative size-7 rounded-l-none border-l
                border-l-[color:var(--panel-text-accent)] bg-[color:var(--toolbar-accent)]
                text-[color:var(--panel-text-accent)] transition-opacity
                hover:bg-[color:var(--toolbar-accent)]
                hover:text-[color:var(--panel-text-accent)] hover:!opacity-80
                disabled:!opacity-50`,
                disabled && 'bg-red-600',
              )}
              disabled={disabled}
              aria-label="Program arguments and input"
            >
              <ChevronDown className="size-4" />
              {hasInput && (
                <span
                  className="animate-scale-up-center absolute -right-0.5 -top-0.5 size-2 rounded-full
                    bg-red-500"
                  aria-hidden="true"
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
            'Add program arguments and input'
          )}
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-80 p-4" sideOffset={8}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="args-input">Program Arguments</Label>
            <div className="relative">
              <Textarea
                id="args-input"
                placeholder="Enter each argument on a new line..."
                value={argsStr}
                onChange={(e) => handleArgsChange(e.target.value)}
                className="max-h-[30vh] min-h-[10vh] resize-y pr-8 text-sm"
              />
              {argsStr && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground absolute right-1 top-1 size-6
                    rounded-full"
                  onClick={clearArgs}
                  aria-label="Clear arguments"
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
                id="stdin-input"
                placeholder="Enter each input on a new line..."
                value={stdin}
                onChange={(e) => handleStdinChange(e.target.value)}
                className="max-h-[30vh] min-h-[10vh] resize-y pr-8 text-sm"
              />
              {stdin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground absolute right-1 top-1 size-6
                    rounded-full"
                  onClick={clearStdin}
                  aria-label="Clear program input"
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

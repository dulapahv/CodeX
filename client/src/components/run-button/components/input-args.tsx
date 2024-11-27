import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export const ExecutionArgs = ({
  onArgsChange,
  onStdinChange,
  disabled,
}: ExecutionArgsProps) => {
  const [argsStr, setArgsStr] = useState('');
  const [stdin, setStdin] = useState('');
  const [open, setOpen] = useState(false);

  const handleArgsChange = (value: string) => {
    setArgsStr(value);
    // Split by spaces but preserve quoted strings
    // This regex splits by spaces except when inside quotes
    const args = value.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    // Remove quotes from quoted strings and handle escaped quotes
    const cleanArgs = args.map(
      (arg) =>
        arg
          .replace(/^"(.*)"$/, '$1') // Remove surrounding quotes
          .replace(/\\"/g, '"'), // Handle escaped quotes
    );
    onArgsChange(cleanArgs);
  };

  const handleStdinChange = (value: string) => {
    setStdin(value);
    onStdinChange(value);
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
                'relative h-7 w-7 rounded-sm hover:bg-transparent hover:opacity-80',
                hasInput && 'bg-muted',
              )}
              disabled={disabled}
              aria-label="Program arguments and input"
            >
              <ChevronDown className="size-4 text-[color:var(--panel-text)]" />
              {hasInput && (
                <span
                  className="animate-fade absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-500"
                  aria-hidden="true"
                />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          {hasInput ? (
            <div className="space-y-1">
              {argsStr && <div>Arguments: {argsStr}</div>}
              {stdin && <div>Has program input</div>}
            </div>
          ) : (
            'Add program arguments and input'
          )}
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="args-input">Program Arguments</Label>
            <Input
              id="args-input"
              type="text"
              placeholder='e.g. arg1 "arg with spaces" arg3'
              value={argsStr}
              onChange={(e) => handleArgsChange(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stdin-input">Program Input (stdin)</Label>
            <Textarea
              id="stdin-input"
              placeholder="Enter input that your program expects to receive..."
              value={stdin}
              onChange={(e) => handleStdinChange(e.target.value)}
              className="h-20 resize-y text-sm"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Examples:</p>
            <p className="mt-1 font-medium">Arguments:</p>
            <ul className="ml-4 list-disc">
              <li>1 2 3</li>
              <li>&quot;hello world&quot; test.txt</li>
              <li>--name &quot;John Doe&quot; --age 30</li>
            </ul>
            <p className="mt-2 font-medium">Program Input:</p>
            <ul className="ml-4 list-disc">
              <li>For input() statements</li>
              <li>One input per line</li>
              <li>Will be fed to program in order</li>
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

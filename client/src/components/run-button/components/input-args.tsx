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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExecutionArgsProps {
  onArgsChange: (args: string[]) => void;
  disabled?: boolean;
}

export const ExecutionArgs = ({
  onArgsChange,
  disabled,
}: ExecutionArgsProps) => {
  const [argsStr, setArgsStr] = useState('');
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'relative size-7 rounded-sm hover:bg-transparent hover:opacity-80',
                argsStr && 'bg-muted',
              )}
              disabled={disabled}
              aria-label="Program arguments"
            >
              <ChevronDown className="size-4 text-[color:var(--panel-text)]" />
              {argsStr && (
                <span
                  className="animate-fade absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-500"
                  aria-hidden="true"
                />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          {argsStr ? `Current arguments: ${argsStr}` : 'Add program arguments'}
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-80 p-4">
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
          <div className="text-xs text-muted-foreground">
            <p>
              Enter space-separated arguments. Use quotes for arguments
              containing spaces.
            </p>
            <p className="mt-1">Examples:</p>
            <ul className="ml-4 mt-1 list-disc">
              <li>1 2 3</li>
              <li>&quot;hello world&quot; test.txt</li>
              <li>--name &quot;John Doe&quot; --age 30</li>
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

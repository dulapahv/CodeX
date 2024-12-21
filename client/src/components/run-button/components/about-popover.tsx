import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AboutPopover = () => (
  <Popover>
    <Tooltip>
      <PopoverTrigger asChild>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 animate-fade-in-top rounded-sm p-0 hover:bg-transparent hover:opacity-80"
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
    <PopoverContent className="w-80" sideOffset={8}>
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Code Execution</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              You can cancel execution at any time by clicking the stop button.
            </p>
            <p>
              Use the dropdown menu to add command-line arguments and input to
              your program.
            </p>
            <p>
              For a list of supported programming languages, visit the{' '}
              <a
                href="https://github.com/engineer-man/piston#Supported-Languages"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-4 !transition-all hover:text-muted-foreground"
              >
                Piston documentation
              </a>
              .
            </p>
            <p>⚠️ Rate limited to 5 requests per second</p>
          </div>
        </div>

        <Separator />

        <div className="text-xs text-muted-foreground">
          <p>
            Powered by{' '}
            <a
              href="https://github.com/engineer-man/piston"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-2 !transition-all hover:text-muted-foreground"
            >
              Piston
            </a>
            , a high performance general purpose code execution engine.
          </p>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);

export { AboutPopover };

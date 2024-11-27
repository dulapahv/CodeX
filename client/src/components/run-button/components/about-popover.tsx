import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

const AboutPopover = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-sm p-0 hover:bg-transparent hover:opacity-80"
      >
        <Info className="size-4 text-[color:var(--panel-text)]" />
        <span className="sr-only">About code execution</span>
      </Button>
    </PopoverTrigger>
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
                className="font-medium underline underline-offset-4"
              >
                Piston documentation
              </a>
              .
            </p>
          </div>
        </div>

        <Separator />

        <div className="text-xs text-muted-foreground">
          <p>Powered by Piston, an open-source code execution engine.</p>
          <p>⚠️ Rate limited to 5 requests per second</p>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);

export { AboutPopover };

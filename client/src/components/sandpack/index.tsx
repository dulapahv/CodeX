import { SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react';
import { CircleHelp } from 'lucide-react';

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

const Sandpack = () => {
  return (
    <SandpackLayout className="!h-full !rounded-none !border-none">
      <SandpackPreview
        className="!h-full"
        showOpenInCodeSandbox={false}
        actionsChildren={
          <Popover>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="size-7 rounded-full border-[color:var(--sp-colors-surface3)] bg-[color:var(--sp-colors-surface2)] p-0 text-[color:var(--sp-colors-clickable)] hover:bg-[color:var(--sp-colors-surface3)] hover:text-[color:var(--sp-colors-hover)]"
                  >
                    <CircleHelp className="size-4" />
                    <span className="sr-only">Help with code preview</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <TooltipContent>
                <p>Help with code preview</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80" sideOffset={8}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Code Preview</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p></p>
                  </div>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground">
                  <p>
                    Powered by{' '}
                    <a
                      href="https://sandpack.codesandbox.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline underline-offset-2"
                    >
                      Sandpack
                    </a>
                    , a component toolkit for live running code editing
                    experiences.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        }
      />
    </SandpackLayout>
  );
};

export { Sandpack };

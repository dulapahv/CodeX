'use client';

import { useRef } from 'react';
import { Info } from 'lucide-react';

import { AboutDialog, type AboutDialogRef } from '@/components/about-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AboutButton = () => {
  const aboutDialogRef = useRef<AboutDialogRef>(null);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-2 right-4 hover:bg-accent/50"
            aria-label="About"
            type="button"
            aria-haspopup="dialog"
            onClick={() => aboutDialogRef.current?.openDialog()}
          >
            <Info className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">About</TooltipContent>
      </Tooltip>
      <AboutDialog ref={aboutDialogRef} />
    </>
  );
};

export { AboutButton };

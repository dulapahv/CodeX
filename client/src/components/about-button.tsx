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
        <TooltipTrigger asChild className="dark">
          <Button
            variant="ghost"
            size="icon"
            className="size-5 rounded-full hover:bg-accent/50"
            aria-label="About"
            type="button"
            aria-haspopup="dialog"
            onClick={() => aboutDialogRef.current?.openDialog()}
          >
            <Info className="size-5 text-white" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">About</TooltipContent>
      </Tooltip>
      <AboutDialog ref={aboutDialogRef} className="dark" />
    </>
  );
};

export { AboutButton };

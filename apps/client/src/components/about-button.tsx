/**
 * About button component that opens the application info dialog.
 * Features:
 * - Info icon button
 * - Dialog trigger
 * - Accessibility support
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { useRef } from 'react';

import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AboutDialog, type AboutDialogRef } from '@/components/about-dialog';

const AboutButton = () => {
  const aboutDialogRef = useRef<AboutDialogRef>(null);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild className="dark">
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-muted-foreground size-5 text-white hover:bg-transparent"
            aria-label="About"
            type="button"
            aria-haspopup="dialog"
            onClick={() => aboutDialogRef.current?.openDialog()}
          >
            <Info className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="mr-1">
          About
        </TooltipContent>
      </Tooltip>
      <AboutDialog ref={aboutDialogRef} forceDark />
    </>
  );
};

export { AboutButton };

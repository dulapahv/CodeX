/**
 * About button component that opens the application info dialog.
 * Features:
 * - Info icon button
 * - Dialog trigger
 * - Accessibility support
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { useRef } from "react";
import { AboutDialog, type AboutDialogRef } from "@/components/about-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AboutButton = () => {
  const aboutDialogRef = useRef<AboutDialogRef>(null);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          className="dark"
          render={
            <Button
              aria-haspopup="dialog"
              aria-label="About"
              className="hover:text-muted-foreground size-5 text-white hover:bg-transparent"
              onClick={() => aboutDialogRef.current?.openDialog()}
              size="icon"
              type="button"
              variant="ghost"
            >
              <InfoIcon className="size-5" />
            </Button>
          }
        />
        <TooltipContent className="mr-1" side="top">
          About
        </TooltipContent>
      </Tooltip>
      <AboutDialog forceDark ref={aboutDialogRef} />
    </>
  );
};

export { AboutButton };

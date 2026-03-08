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

import { Info } from "lucide-react";
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
        <TooltipTrigger asChild className="dark">
          <Button
            aria-haspopup="dialog"
            aria-label="About"
            className="size-5 text-white hover:bg-transparent hover:text-muted-foreground"
            onClick={() => aboutDialogRef.current?.openDialog()}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Info className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="mr-1" side="top">
          About
        </TooltipContent>
      </Tooltip>
      <AboutDialog forceDark ref={aboutDialogRef} />
    </>
  );
};

export { AboutButton };

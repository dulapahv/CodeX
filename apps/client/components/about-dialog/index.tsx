/**
 * About dialog component that provides information about the application.
 * Features:
 * - Responsive dialog/drawer based on screen size
 * - Project description
 * - Preview image with loading state
 * - External links
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ExternalLink } from "./components/external-link";

interface AboutDialogRef {
  closeDialog: () => void;
  openDialog: () => void;
}

interface AboutDialogProps {
  forceDark?: boolean;
}

const AboutDialog = forwardRef<AboutDialogRef, AboutDialogProps>(
  ({ forceDark = false }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isImgLoaded, setIsImgLoaded] = useState(false);

    const isDesktop = useMediaQuery("(min-width: 768px)");

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    // Expose openDialog and closeDialog to the parent component
    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    useEffect(() => {
      if (isOpen) {
        setIsImgLoaded(false);
      }
    }, [isOpen]);

    useEffect(() => {
      setIsImgLoaded(false);
    }, []);

    if (isDesktop) {
      return (
        <Dialog aria-label="About CodeX" onOpenChange={setIsOpen} open={isOpen}>
          <DialogContent className={cn("max-w-2xl", forceDark && "dark")}>
            <DialogHeader className="text-left text-foreground">
              <DialogTitle>{SITE_NAME}</DialogTitle>
              <DialogDescription className="pt-2 text-base">
                This project is part of the course &quot;COMPSCI4025P Level 4
                Individual Project&quot; at the University of Glasgow.
              </DialogDescription>
            </DialogHeader>

            <div
              aria-label="CodeX application preview"
              className="relative aspect-[600/315]"
              role="img"
            >
              <Image
                alt="CodeX application interface preview"
                aria-hidden={!isImgLoaded}
                className="absolute rounded-md object-cover"
                fill
                loading="eager"
                onLoad={() => setIsImgLoaded(true)}
                quality={100}
                sizes="1200px"
                src="/images/cover.png"
              />
              {!isImgLoaded && (
                <Skeleton
                  aria-label="Loading image..."
                  className="absolute inset-0 h-full w-full rounded-lg"
                />
              )}
            </div>

            <Separator />

            <div className="space-y-2 text-foreground">
              <p className="text-center">
                Made with 💕 by <span className="font-medium">dulapahv</span>
              </p>
              <nav
                aria-label="External links"
                className="grid grid-cols-4 gap-2"
              >
                <ExternalLink forceDark={forceDark} />
              </nav>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button aria-label="Close dialog" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer aria-label="About CodeX" onOpenChange={setIsOpen} open={isOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">{SITE_NAME}</DrawerTitle>
            <DrawerDescription className="pt-2 text-left text-base">
              This project is part of the course &quot;COMPSCI4025P Level 4
              Individual Project&quot; at the University of Glasgow.
            </DrawerDescription>
          </DrawerHeader>

          <div
            aria-label="CodeX application preview"
            className="w-full px-4"
            role="img"
          >
            <div className="relative aspect-[600/315] w-full max-w-full">
              <Image
                alt="CodeX application interface preview"
                aria-hidden={!isImgLoaded}
                className="rounded-md object-cover"
                fill
                loading="eager"
                onLoad={() => setIsImgLoaded(true)}
                quality={100}
                sizes="(max-width: 768px) 100vw, 600px"
                src="/images/cover.png"
              />
              {!isImgLoaded && (
                <Skeleton
                  aria-label="Loading image..."
                  className="absolute inset-0 h-full w-full rounded-lg"
                />
              )}
            </div>
          </div>

          <div className="px-4">
            <Separator aria-hidden="true" className="my-4" />
          </div>

          <div className="mx-4 space-y-2">
            <p className="text-center">
              Made with 💕 by <span className="font-medium">dulapahv</span>
            </p>
            <nav aria-label="External links" className="grid grid-cols-2 gap-2">
              <ExternalLink forceDark={forceDark} />
            </nav>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button aria-label="Close drawer" variant="secondary">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
);

AboutDialog.displayName = "OpenPromptDialog";

export { AboutDialog, type AboutDialogRef };

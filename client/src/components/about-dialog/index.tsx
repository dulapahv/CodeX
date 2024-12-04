import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import Image from 'next/image';

import {
  CONTACT_URL,
  GITHUB_URL,
  PORTFOLIO_URL,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface AboutDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

interface AboutDialogProps {
  className?: string;
}

const AboutDialog = forwardRef<AboutDialogRef, AboutDialogProps>(
  ({ className = '' }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isImgLoaded, setIsImgLoaded] = useState(false);

    const isDesktop = useMediaQuery('(min-width: 768px)');

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
    }, [isDesktop]);

    if (isDesktop) {
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} aria-label="About Kasca">
          <DialogContent className={cn('max-w-2xl', className)}>
            <DialogHeader className="text-left text-foreground">
              <DialogTitle>{SITE_NAME}</DialogTitle>
              <DialogDescription className="pt-2 text-base">
                {SITE_DESCRIPTION}
              </DialogDescription>
            </DialogHeader>

            <div
              className="relative aspect-[600/315]"
              aria-label="Kasca application preview"
            >
              <Image
                src="/images/cover.png"
                alt="Kasca application interface preview"
                className="absolute rounded-md object-cover"
                fill
                sizes="1200px"
                quality={100}
                priority
                onLoad={() => setIsImgLoaded(true)}
                aria-hidden={!isImgLoaded}
              />
              {!isImgLoaded && (
                <Skeleton
                  className="absolute inset-0 h-full w-full rounded-lg"
                  aria-label="Loading image..."
                />
              )}
            </div>

            <Separator aria-hidden="true" />

            <div className="space-y-2 text-foreground">
              <p>
                This project is part of the course &quot;COMPSCI4025P Level 4
                Individual Project&quot; at the University of Glasgow.
              </p>
              <p className="pt-2 text-center font-medium">
                Made with 💕 by dulapahv
              </p>
              <nav
                className="grid grid-cols-4 gap-2"
                aria-label="External links"
              >
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={PORTFOLIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit portfolio website (opens in new tab)"
                  >
                    Portfolio
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit GitHub profile (opens in new tab)"
                  >
                    GitHub Profile
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit Kasca GitHub repository (opens in new tab)"
                  >
                    Kasca GitHub
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={CONTACT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contact me (opens in new tab)"
                  >
                    Contact
                  </a>
                </Button>
              </nav>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary" aria-label="Close dialog">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen} aria-label="About Kasca">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">{SITE_NAME}</DrawerTitle>
            <DrawerDescription className="pt-2 text-left text-base text-foreground">
              {SITE_DESCRIPTION}
            </DrawerDescription>
          </DrawerHeader>

          <div className="w-full px-4" aria-label="Kasca application preview">
            <div className="relative aspect-[600/315] w-full max-w-full">
              <Image
                src="/images/cover.png"
                alt="Kasca application interface preview"
                className="rounded-md object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                quality={100}
                priority
                onLoad={() => setIsImgLoaded(true)}
                aria-hidden={!isImgLoaded}
              />
              {!isImgLoaded && (
                <Skeleton
                  className="absolute inset-0 h-full w-full rounded-lg"
                  aria-label="Loading image..."
                />
              )}
            </div>
          </div>

          <div className="px-4">
            <Separator className="my-4" aria-hidden="true" />
          </div>

          <div className="mx-4 space-y-2">
            <p>
              This project is part of the course &quot;COMPSCI4025P Level 4
              Individual Project&quot; at the University of Glasgow.
            </p>
            <p className="pt-2 text-center font-medium">
              Made with 💕 by dulapahv
            </p>
            <nav className="grid grid-cols-2 gap-2" aria-label="External links">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit portfolio website (opens in new tab)"
                >
                  Portfolio
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit GitHub profile (opens in new tab)"
                >
                  GitHub Profile
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Kasca GitHub repository (opens in new tab)"
                >
                  Kasca GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact me (opens in new tab)"
                >
                  Contact
                </a>
              </Button>
            </nav>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary" aria-label="Close drawer">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
);

AboutDialog.displayName = 'OpenPromptDialog';

export { AboutDialog, type AboutDialogRef };

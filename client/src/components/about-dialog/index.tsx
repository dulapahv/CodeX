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

const AboutDialog = forwardRef<AboutDialogRef>((props, ref) => {
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
      <Dialog open={isOpen} onOpenChange={setIsOpen} aria-label="About dialog">
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{SITE_NAME}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-[600/315]">
            <Image
              src="/images/ogp.png"
              alt="Kasca cover image"
              className="absolute rounded-md"
              fill
              sizes="1200px"
              quality={100}
              onLoad={() => setIsImgLoaded(true)}
            />
            {!isImgLoaded && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
            )}
          </div>
          <Separator />
          <div className="space-y-2">
            <p>{SITE_DESCRIPTION}</p>
            <p>
              This project is part of the course &quot;COMPSCI4025P Level 4
              Individual Project&quot; at the University of Glasgow.
            </p>
            <p className="pt-2 text-center font-semibold">
              Made with 💕 by dulapahv
            </p>
            <div className="grid grid-cols-4">
              <Button variant="ghost">
                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Portfolio
                </a>
              </Button>
              <Button variant="ghost">
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  GitHub Profile
                </a>
              </Button>
              <Button variant="ghost">
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  Kasca GitHub
                </a>
              </Button>
              <Button variant="ghost">
                <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
                  Contact
                </a>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} aria-label="About drawer">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{SITE_NAME}</DrawerTitle>
        </DrawerHeader>
        <div className="relative mx-4 aspect-[600/315]">
          <Image
            src="/images/ogp.png"
            alt="Kasca cover image"
            className="absolute rounded-md"
            fill
            sizes="1200px"
            quality={100}
            onLoad={() => setIsImgLoaded(true)}
          />
          {!isImgLoaded && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
          )}
        </div>
        <div className="px-4">
          <Separator className="my-4" />
        </div>
        <div className="mx-4 space-y-2">
          <p>{SITE_DESCRIPTION}</p>
          <p>
            This project is a part of the course &quot;COMPSCI4025P Level 4
            Individual Project&quot; at the University of Glasgow.
          </p>
          <p className="pt-2 text-center font-semibold">
            Made with 💕 by dulapahv
          </p>
          <div className="grid grid-cols-2">
            <Button variant="ghost">
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
                Portfolio
              </a>
            </Button>
            <Button variant="ghost">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub Profile
              </a>
            </Button>
            <Button variant="ghost">
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                Kasca GitHub
              </a>
            </Button>
            <Button variant="ghost">
              <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
                Contact
              </a>
            </Button>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});

AboutDialog.displayName = 'OpenPromptDialog';

export { AboutDialog, type AboutDialogRef };

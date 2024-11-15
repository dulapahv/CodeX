import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

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

interface AboutDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

const AboutDialog = forwardRef<AboutDialogRef>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  // Expose openDialog and closeDialog to the parent component
  useImperativeHandle(ref, () => ({
    openDialog,
    closeDialog,
  }));

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kasca - Code Collaboration Platform</DialogTitle>
            <DialogDescription>
              Developed with 💕 by Dulapah Vibulsanti
            </DialogDescription>
          </DialogHeader>
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
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Kasca</DrawerTitle>
          <DrawerDescription>
            Developed with 💕 by Dulapah Vibulsanti
          </DrawerDescription>
        </DrawerHeader>
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

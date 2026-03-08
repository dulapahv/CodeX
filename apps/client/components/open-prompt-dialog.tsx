/**
 * Confirmation dialog component for opening new files.
 * Features:
 * - Responsive dialog/drawer based on screen size
 * - File open confirmation
 * - Unsaved changes warning
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
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
import { useMediaQuery } from "@/hooks/use-media-query";

const DEFAULT_TITLE = "Open a new file?";
const DEFAULT_DESCRIPTION =
  "Opening a new file will replace the current content. Any unsaved changes will be lost.";

interface PromptSaveDialogProps {
  callback: () => void;
}

interface OpenPromptDialogRef {
  closeDialog: () => void;
  openDialog: () => void;
}

const OpenPromptDialog = forwardRef<OpenPromptDialogRef, PromptSaveDialogProps>(
  ({ callback }: PromptSaveDialogProps, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    const isDesktop = useMediaQuery("(min-width: 768px)");

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    // Expose openDialog and closeDialog to the parent component
    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    if (isDesktop) {
      return (
        <Dialog onOpenChange={setIsOpen} open={isOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{DEFAULT_TITLE}</DialogTitle>
              <DialogDescription>{DEFAULT_DESCRIPTION}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={callback}>Open</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer onOpenChange={setIsOpen} open={isOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{DEFAULT_TITLE}</DrawerTitle>
            <DrawerDescription>{DEFAULT_DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button
              onClick={() => {
                closeDialog();
                callback();
              }}
            >
              Open
            </Button>
            <DrawerClose asChild>
              <Button onClick={closeDialog} variant="secondary">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
);

OpenPromptDialog.displayName = "OpenPromptDialog";

export { OpenPromptDialog, type OpenPromptDialogRef };

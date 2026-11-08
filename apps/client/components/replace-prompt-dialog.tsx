/**
 * Asks before a chosen file replaces shared content, such as the code or the
 * note, for everyone in the room. Shown after the file is picked, so the
 * question can name it.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

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

interface ReplacePromptDialogProps {
  confirmLabel: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}

const ReplacePromptDialog = ({
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  open,
  title,
}: ReplacePromptDialogProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
    }
  };

  if (isDesktop) {
    return (
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="break-all">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Cancel</Button>} />
            <Button onClick={onConfirm}>{confirmLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={handleOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader className="pb-4">
          <DrawerTitle className="break-all">{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
          <DrawerClose render={<Button variant="secondary">Cancel</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export { ReplacePromptDialog };

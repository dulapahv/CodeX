/**
 * Responsive dialog component that renders as Dialog on desktop
 * and Drawer on mobile devices.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveDialogProps {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

export const ResponsiveDialog = ({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ResponsiveDialogProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={isOpen}>
        <DialogContent className="flex h-[90vh] flex-col gap-4 sm:max-w-2xl">
          <DialogHeader className="flex-shrink-0 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter className="flex items-center justify-between gap-2 sm:gap-0">
            {footer}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={isOpen}>
      <DrawerContent>
        <div className="flex h-[90vh] flex-col">
          <DrawerHeader className="flex-shrink-0 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {children}
          </div>
          <DrawerFooter className="flex-shrink-0">{footer}</DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

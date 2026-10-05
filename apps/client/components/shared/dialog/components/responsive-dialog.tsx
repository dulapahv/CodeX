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
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  fullHeight?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  status?: ReactNode;
  title: string;
}

export const ResponsiveDialog = ({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  fullHeight = true,
  status,
}: ResponsiveDialogProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={isOpen}>
        <DialogContent
          className={cn(
            "flex flex-col gap-4 sm:max-w-2xl",
            fullHeight && "h-[90vh]"
          )}
        >
          <DialogHeader className="text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          {status}
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
        <div
          className={cn(
            "flex flex-col gap-4",
            fullHeight && "h-[calc(100dvh-6rem)]"
          )}
        >
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {children}
          </div>
          <DrawerFooter>
            {status}
            {footer}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

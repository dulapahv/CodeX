/**
 * Responsive dialog component that renders as AlertDialog on desktop
 * and Drawer on mobile devices.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  dismissible?: boolean;
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
  dismissible = false,
}: ResponsiveDialogProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <AlertDialog onOpenChange={onOpenChange} open={isOpen}>
        <AlertDialogContent
          autoFocus={false}
          className="flex h-[90vh] flex-col gap-4 sm:max-w-2xl"
        >
          <AlertDialogHeader className="flex-shrink-0 space-y-0 text-left">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {children}
          <AlertDialogFooter className="flex items-center justify-between gap-2 sm:gap-0">
            {footer}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer dismissible={dismissible} onOpenChange={onOpenChange} open={isOpen}>
      <DrawerContent className="first:[&>div]:mt-0 first:[&>div]:bg-transparent">
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

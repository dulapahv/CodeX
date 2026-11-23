/**
 * Takes files dragged in from the computer and adds them to the room,
 * asking before replacing any with the same name.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { type DragEvent, type ReactNode, useRef, useState } from "react";

import { readLocalFiles } from "@/components/toolbar/utils";
import { useRoomAccess } from "@/lib/realtime/room-context";
import { cn } from "@/lib/utils";

import { useWorkbench } from "./workbench-provider";

const hasFiles = (event: DragEvent) =>
  event.dataTransfer.types.includes("Files");

interface FileDropZoneProps {
  children: ReactNode;
  className?: string;
  label: string;
}

// Handled while capturing, before the code editor treats a drop as text
export const FileDropZone = ({
  children,
  className,
  label,
}: FileDropZoneProps) => {
  const { importFiles } = useWorkbench();
  // Viewers can't add files, but a drop still mustn't open the file in place
  // of the room
  const { canEdit } = useRoomAccess();
  const [isOver, setIsOver] = useState(false);
  // Entering a child fires before leaving its parent, so count the depth
  const depthRef = useRef(0);

  const reset = () => {
    depthRef.current = 0;
    setIsOver(false);
  };

  return (
    <div
      className={cn("relative", className)}
      onDragEnterCapture={(event) => {
        if (hasFiles(event)) {
          event.preventDefault();
          depthRef.current += 1;
          setIsOver(canEdit);
        }
      }}
      onDragLeaveCapture={(event) => {
        if (hasFiles(event)) {
          depthRef.current -= 1;
          if (depthRef.current <= 0) {
            reset();
          }
        }
      }}
      onDragOverCapture={(event) => {
        if (hasFiles(event)) {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = canEdit ? "copy" : "none";
        }
      }}
      onDropCapture={async (event) => {
        if (!hasFiles(event)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        reset();
        if (!canEdit) {
          return;
        }
        // The drop's files can only be read during the event
        const dropped = [...event.dataTransfer.files];
        importFiles(await readLocalFiles(dropped));
      }}
    >
      {children}
      {isOver && (
        <div className="border-wb-accent bg-wb-accent/10 text-wb-fg pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed text-[13px]">
          {label}
        </div>
      )}
    </div>
  );
};

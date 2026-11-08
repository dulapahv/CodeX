/**
 * Opens the Excalidraw canvas to draw a new drawing or edit an existing one.
 * Escape and clicks outside are left to the canvas so they can't discard a
 * drawing.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, type NodeKey } from "lexical";
import { lazy, Suspense, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

import { type ExcalidrawPayload, INSERT_EXCALIDRAW_COMMAND } from "../commands";
import { $isExcalidrawNode } from "../nodes/excalidraw-node";
import { restoreEditorFocus } from "../utils";

const ExcalidrawEditor = lazy(() => import("../components/excalidraw-editor"));

const LOADING = (
  <div className="flex flex-1 items-center justify-center">
    <Spinner />
  </div>
);

interface ExcalidrawDialogProps {
  // null draws a new drawing, a key edits that one
  nodeKey: NodeKey | null | undefined;
  onClose: () => void;
}

const ExcalidrawDialog = ({ nodeKey, onClose }: ExcalidrawDialogProps) => {
  const [editor] = useLexicalComposerContext();
  const isOpen = nodeKey !== undefined;
  // Excalidraw measures its box once, so it waits for the dialog to finish
  // zooming in or it keeps the smaller size
  const [hasOpened, setHasOpened] = useState(false);

  const data = useMemo(
    () =>
      nodeKey
        ? editor.getEditorState().read(() => {
            const node = $getNodeByKey(nodeKey);
            return $isExcalidrawNode(node) ? node.getDrawing().data : "";
          })
        : "",
    [editor, nodeKey]
  );

  const save = (drawing: ExcalidrawPayload | null) => {
    if (nodeKey) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!$isExcalidrawNode(node)) {
          return;
        }
        if (drawing) {
          node.setDrawing(drawing);
        } else {
          node.remove();
        }
      });
    } else if (drawing) {
      editor.dispatchCommand(INSERT_EXCALIDRAW_COMMAND, drawing);
    }
    onClose();
  };

  return (
    <Dialog
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (open) {
          return;
        }
        if (details.reason === "escape-key") {
          details.cancel();
          return;
        }
        onClose();
      }}
      onOpenChangeComplete={setHasOpened}
      open={isOpen}
    >
      <DialogContent
        className="flex h-[85vh] w-[min(1200px,95vw)] max-w-none flex-col sm:max-w-none"
        finalFocus={() => restoreEditorFocus(editor)}
      >
        <DialogHeader>
          <DialogTitle>{nodeKey ? "Edit drawing" : "New drawing"}</DialogTitle>
          <DialogDescription className="sr-only">
            Draw with Excalidraw, then save the drawing into the note.
          </DialogDescription>
        </DialogHeader>
        {isOpen && (
          <Suspense fallback={LOADING}>
            {hasOpened ? (
              <ExcalidrawEditor data={data} onCancel={onClose} onSave={save} />
            ) : (
              LOADING
            )}
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { ExcalidrawDialog };

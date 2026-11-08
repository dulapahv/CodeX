/**
 * Hosts the notepad's insert forms and opens each one when its command is
 * dispatched from the toolbar, the slash menu or a block. Small forms open as
 * popovers next to whatever opened them, while images and drawings get a
 * full dialog.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_EDITOR,
  type LexicalCommand,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import { useEffect, useState } from "react";

import {
  type EquationDialogPayload,
  OPEN_EMBED_DIALOG_COMMAND,
  OPEN_EQUATION_DIALOG_COMMAND,
  OPEN_EXCALIDRAW_DIALOG_COMMAND,
  OPEN_IMAGE_DIALOG_COMMAND,
  OPEN_POLL_DIALOG_COMMAND,
  OPEN_RUBY_DIALOG_COMMAND,
  OPEN_TABLE_DIALOG_COMMAND,
} from "../commands";
import {
  getPopoverAnchor,
  getToolbarOrigin,
  type PopoverAnchor,
} from "../components/insert-popover";
import { ExcalidrawDialog } from "../dialogs/excalidraw-dialog";
import { ImageDialog } from "../dialogs/image-dialog";
import type { EmbedProvider } from "../nodes/embed-node";
import { EmbedPopover } from "../popovers/embed-popover";
import { EquationPopover } from "../popovers/equation-popover";
import { PollPopover } from "../popovers/poll-popover";
import { RubyPopover } from "../popovers/ruby-popover";
import { TablePopover } from "../popovers/table-popover";

const registerOpen = <T,>(
  editor: LexicalEditor,
  command: LexicalCommand<T>,
  open: (payload: T) => void
) =>
  editor.registerCommand(
    command,
    (payload) => {
      open(payload);
      return true;
    },
    COMMAND_PRIORITY_EDITOR
  );

type SimplePopover = "poll" | "ruby" | "table";

interface InsertDialogsPluginProps {
  anchorElem: HTMLElement;
}

const InsertDialogsPlugin = ({ anchorElem }: InsertDialogsPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const [anchor, setAnchor] = useState<PopoverAnchor | null>(null);
  const [popover, setPopover] = useState<SimplePopover | null>(null);
  const [equation, setEquation] = useState<EquationDialogPayload | null>(null);
  const [embed, setEmbed] = useState<EmbedProvider | null>(null);
  const [imageKind, setImageKind] = useState<"image" | "gif" | null>(null);
  const [drawing, setDrawing] = useState<NodeKey | null | undefined>(undefined);

  useEffect(() => {
    // Notes the toolbar button now, while its action is running, then waits
    // a frame so the update that asked for it, such as the slash menu removing
    // its text, is on the page before the caret is measured
    const openPopover =
      <T,>(
        open: (payload: T) => void,
        getNodeKey?: (payload: T) => NodeKey | undefined
      ) =>
      (payload: T) => {
        const origin = getToolbarOrigin(editor);
        requestAnimationFrame(() => {
          setAnchor(
            getPopoverAnchor(editor, anchorElem, {
              nodeKey: getNodeKey?.(payload),
              origin,
            })
          );
          open(payload);
        });
      };

    return mergeRegister(
      registerOpen(
        editor,
        OPEN_TABLE_DIALOG_COMMAND,
        openPopover(() => setPopover("table"))
      ),
      registerOpen(
        editor,
        OPEN_POLL_DIALOG_COMMAND,
        openPopover(() => setPopover("poll"))
      ),
      registerOpen(
        editor,
        OPEN_RUBY_DIALOG_COMMAND,
        openPopover(() => setPopover("ruby"))
      ),
      registerOpen(
        editor,
        OPEN_EQUATION_DIALOG_COMMAND,
        openPopover(
          (payload: EquationDialogPayload) => setEquation(payload),
          (payload) => payload.nodeKey
        )
      ),
      registerOpen(
        editor,
        OPEN_EMBED_DIALOG_COMMAND,
        openPopover((provider: EmbedProvider) => setEmbed(provider))
      ),
      registerOpen(editor, OPEN_IMAGE_DIALOG_COMMAND, setImageKind),
      registerOpen(editor, OPEN_EXCALIDRAW_DIALOG_COMMAND, setDrawing)
    );
  }, [anchorElem, editor]);

  const closePopover = () => setPopover(null);
  const popoverProps = { anchor, anchorElem, onClose: closePopover };

  return (
    <>
      <TablePopover {...popoverProps} open={popover === "table"} />
      <PollPopover {...popoverProps} open={popover === "poll"} />
      <RubyPopover {...popoverProps} open={popover === "ruby"} />
      <EquationPopover
        anchor={anchor}
        anchorElem={anchorElem}
        onClose={() => setEquation(null)}
        payload={equation}
      />
      <EmbedPopover
        anchor={anchor}
        anchorElem={anchorElem}
        onClose={() => setEmbed(null)}
        provider={embed}
      />
      <ImageDialog
        kind={imageKind ?? "image"}
        onClose={() => setImageKind(null)}
        open={imageKind !== null}
      />
      <ExcalidrawDialog
        nodeKey={drawing}
        onClose={() => setDrawing(undefined)}
      />
    </>
  );
};

export { InsertDialogsPlugin };

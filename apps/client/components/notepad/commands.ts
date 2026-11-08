/**
 * Commands the toolbar, slash menu, dialogs and nodes use to insert and edit
 * notepad blocks.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { createCommand, type LexicalCommand, type NodeKey } from "lexical";

import type { CalloutKind } from "./nodes/callout-node";
import type { EmbedProvider } from "./nodes/embed-node";
import type { ImagePayload } from "./nodes/image-node";
import type { StickyColor } from "./nodes/sticky-node";

export interface EquationPayload {
  equation: string;
  inline: boolean;
}

export interface EquationDialogPayload extends Partial<EquationPayload> {
  nodeKey?: NodeKey;
}

export interface EmbedPayload {
  provider: EmbedProvider;
  url: string;
}

export interface PollPayload {
  options: string[];
  question: string;
}

export interface ExcalidrawPayload {
  data: string;
  svg: string;
}

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand(
  "INSERT_IMAGE_COMMAND"
);
export const INSERT_CALLOUT_COMMAND: LexicalCommand<CalloutKind> =
  createCommand("INSERT_CALLOUT_COMMAND");
export const INSERT_STICKY_COMMAND: LexicalCommand<StickyColor> = createCommand(
  "INSERT_STICKY_COMMAND"
);
export const INSERT_LAYOUT_COMMAND: LexicalCommand<string> = createCommand(
  "INSERT_LAYOUT_COMMAND"
);
export const INSERT_COLLAPSIBLE_COMMAND: LexicalCommand<void> = createCommand(
  "INSERT_COLLAPSIBLE_COMMAND"
);
export const INSERT_EQUATION_COMMAND: LexicalCommand<EquationPayload> =
  createCommand("INSERT_EQUATION_COMMAND");
export const INSERT_DATE_COMMAND: LexicalCommand<string> = createCommand(
  "INSERT_DATE_COMMAND"
);
export const INSERT_POLL_COMMAND: LexicalCommand<PollPayload> = createCommand(
  "INSERT_POLL_COMMAND"
);
export const INSERT_EMBED_COMMAND: LexicalCommand<EmbedPayload> = createCommand(
  "INSERT_EMBED_COMMAND"
);
export const INSERT_EXCALIDRAW_COMMAND: LexicalCommand<ExcalidrawPayload> =
  createCommand("INSERT_EXCALIDRAW_COMMAND");
export const TOGGLE_RUBY_COMMAND: LexicalCommand<string | null> = createCommand(
  "TOGGLE_RUBY_COMMAND"
);

export const OPEN_IMAGE_DIALOG_COMMAND: LexicalCommand<"image" | "gif"> =
  createCommand("OPEN_IMAGE_DIALOG_COMMAND");
export const OPEN_TABLE_DIALOG_COMMAND: LexicalCommand<void> = createCommand(
  "OPEN_TABLE_DIALOG_COMMAND"
);
export const OPEN_EQUATION_DIALOG_COMMAND: LexicalCommand<EquationDialogPayload> =
  createCommand("OPEN_EQUATION_DIALOG_COMMAND");
export const OPEN_POLL_DIALOG_COMMAND: LexicalCommand<void> = createCommand(
  "OPEN_POLL_DIALOG_COMMAND"
);
export const OPEN_EMBED_DIALOG_COMMAND: LexicalCommand<EmbedProvider> =
  createCommand("OPEN_EMBED_DIALOG_COMMAND");
export const OPEN_EXCALIDRAW_DIALOG_COMMAND: LexicalCommand<NodeKey | null> =
  createCommand("OPEN_EXCALIDRAW_DIALOG_COMMAND");
export const OPEN_RUBY_DIALOG_COMMAND: LexicalCommand<void> = createCommand(
  "OPEN_RUBY_DIALOG_COMMAND"
);

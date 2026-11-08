/**
 * Everything the Insert menu and the slash menu can add to a note, grouped
 * the way the Insert menu shows it.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/extension";
import {
  CalendarBlankIcon,
  CaretCircleRightIcon,
  ChartBarHorizontalIcon,
  CodeBlockIcon,
  ColumnsIcon,
  FigmaLogoIcon,
  FunctionIcon,
  GifIcon,
  type Icon,
  ImageIcon,
  MinusIcon,
  NoteBlankIcon,
  ScribbleIcon,
  TableIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import type { LexicalEditor } from "lexical";

import { CALLOUT_ICONS } from "./blocks";
import {
  INSERT_CALLOUT_COMMAND,
  INSERT_COLLAPSIBLE_COMMAND,
  INSERT_DATE_COMMAND,
  INSERT_LAYOUT_COMMAND,
  INSERT_STICKY_COMMAND,
  OPEN_EMBED_DIALOG_COMMAND,
  OPEN_EQUATION_DIALOG_COMMAND,
  OPEN_EXCALIDRAW_DIALOG_COMMAND,
  OPEN_IMAGE_DIALOG_COMMAND,
  OPEN_POLL_DIALOG_COMMAND,
  OPEN_TABLE_DIALOG_COMMAND,
} from "./commands";
import { setBlockType } from "./formatting";
import { CALLOUT_KINDS, type CalloutKind } from "./nodes/callout-node";
import { todayIsoDate } from "./nodes/date-node";
import { STICKY_COLORS, type StickyColor } from "./nodes/sticky-node";

export interface InsertOption {
  icon: Icon;
  keywords: string[];
  label: string;
  run: (editor: LexicalEditor) => void;
}

export interface InsertGroup {
  icon: Icon;
  label: string;
  options: InsertOption[];
}

export const LAYOUT_TEMPLATES = [
  { label: "2 columns", template: "1fr 1fr" },
  { label: "2 columns, 25% and 75%", template: "1fr 3fr" },
  { label: "2 columns, 75% and 25%", template: "3fr 1fr" },
  { label: "3 columns", template: "1fr 1fr 1fr" },
  { label: "3 columns, 25%, 50% and 25%", template: "1fr 2fr 1fr" },
  { label: "4 columns", template: "1fr 1fr 1fr 1fr" },
];

export const STICKY_SWATCHES: Record<StickyColor, string> = {
  blue: "bg-sky-300",
  green: "bg-lime-300",
  pink: "bg-pink-300",
  purple: "bg-violet-300",
  yellow: "bg-yellow-200",
};

export const MEDIA_OPTIONS: InsertOption[] = [
  {
    icon: ImageIcon,
    keywords: ["image", "picture", "photo", "upload"],
    label: "Image",
    run: (editor) => editor.dispatchCommand(OPEN_IMAGE_DIALOG_COMMAND, "image"),
  },
  {
    icon: GifIcon,
    keywords: ["gif", "animation"],
    label: "GIF",
    run: (editor) => editor.dispatchCommand(OPEN_IMAGE_DIALOG_COMMAND, "gif"),
  },
  {
    icon: ScribbleIcon,
    keywords: ["drawing", "excalidraw", "sketch", "diagram", "whiteboard"],
    label: "Drawing",
    run: (editor) =>
      editor.dispatchCommand(OPEN_EXCALIDRAW_DIALOG_COMMAND, null),
  },
];

export const EMBED_OPTIONS: InsertOption[] = [
  {
    icon: YoutubeLogoIcon,
    keywords: ["youtube", "video", "embed"],
    label: "YouTube video",
    run: (editor) =>
      editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, "youtube"),
  },
  {
    icon: XLogoIcon,
    keywords: ["x", "twitter", "tweet", "post", "embed"],
    label: "X post",
    run: (editor) => editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, "x"),
  },
  {
    icon: FigmaLogoIcon,
    keywords: ["figma", "design", "prototype", "embed"],
    label: "Figma file",
    run: (editor) => editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, "figma"),
  },
];

export const BLOCK_INSERT_OPTIONS: InsertOption[] = [
  {
    icon: TableIcon,
    keywords: ["table", "grid", "spreadsheet"],
    label: "Table",
    run: (editor) =>
      editor.dispatchCommand(OPEN_TABLE_DIALOG_COMMAND, undefined),
  },
  {
    icon: CodeBlockIcon,
    keywords: ["code", "snippet", "pre"],
    label: "Code block",
    run: (editor) => setBlockType(editor, "code", "paragraph"),
  },
  {
    icon: MinusIcon,
    keywords: ["divider", "horizontal rule", "hr", "separator", "line"],
    label: "Divider",
    run: (editor) =>
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
  {
    icon: CaretCircleRightIcon,
    keywords: ["collapsible", "toggle", "details", "accordion", "fold"],
    label: "Collapsible section",
    run: (editor) =>
      editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
  },
  {
    icon: FunctionIcon,
    keywords: ["equation", "math", "latex", "formula", "katex"],
    label: "Equation",
    run: (editor) => editor.dispatchCommand(OPEN_EQUATION_DIALOG_COMMAND, {}),
  },
  {
    icon: ChartBarHorizontalIcon,
    keywords: ["poll", "vote", "survey"],
    label: "Poll",
    run: (editor) =>
      editor.dispatchCommand(OPEN_POLL_DIALOG_COMMAND, undefined),
  },
  {
    icon: CalendarBlankIcon,
    keywords: ["date", "today", "calendar", "day"],
    label: "Date",
    run: (editor) =>
      editor.dispatchCommand(INSERT_DATE_COMMAND, todayIsoDate()),
  },
];

export const LAYOUT_OPTIONS: InsertOption[] = LAYOUT_TEMPLATES.map(
  ({ label, template }) => ({
    icon: ColumnsIcon,
    keywords: ["columns", "layout", "grid", "side by side"],
    label,
    run: (editor) => editor.dispatchCommand(INSERT_LAYOUT_COMMAND, template),
  })
);

export const CALLOUT_OPTIONS: InsertOption[] = (
  Object.keys(CALLOUT_KINDS) as CalloutKind[]
).map((kind) => ({
  icon: CALLOUT_ICONS[kind],
  keywords: ["callout", "admonition", "alert", kind],
  label: `${CALLOUT_KINDS[kind]} callout`,
  run: (editor) => editor.dispatchCommand(INSERT_CALLOUT_COMMAND, kind),
}));

export const STICKY_OPTIONS: InsertOption[] = (
  Object.keys(STICKY_COLORS) as StickyColor[]
).map((color) => ({
  icon: NoteBlankIcon,
  keywords: ["sticky", "note", "post-it", color],
  label: `${STICKY_COLORS[color]} sticky note`,
  run: (editor) => editor.dispatchCommand(INSERT_STICKY_COMMAND, color),
}));

export const ALL_INSERT_OPTIONS: InsertOption[] = [
  ...MEDIA_OPTIONS,
  ...EMBED_OPTIONS,
  ...BLOCK_INSERT_OPTIONS,
  ...LAYOUT_OPTIONS,
  ...CALLOUT_OPTIONS,
  ...STICKY_OPTIONS,
];

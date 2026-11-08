/**
 * Block types and callouts as the menus list them, with the markdown that
 * creates each one while typing.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  CodeBlockIcon,
  type Icon,
  InfoIcon,
  LightbulbIcon,
  ListBulletsIcon,
  ListChecksIcon,
  ListNumbersIcon,
  NoteIcon,
  QuotesIcon,
  TextHFiveIcon,
  TextHFourIcon,
  TextHOneIcon,
  TextHSixIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextTIcon,
  WarningIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react";

import type { BlockType } from "./formatting";
import type { CalloutKind } from "./nodes/callout-node";

export interface BlockOption {
  icon: Icon;
  keywords: string[];
  label: string;
  markdown?: string;
  type: BlockType;
}

export const BLOCK_OPTIONS: BlockOption[] = [
  {
    icon: TextTIcon,
    keywords: ["paragraph", "text", "plain"],
    label: "Text",
    type: "paragraph",
  },
  {
    icon: TextHOneIcon,
    keywords: ["heading", "title", "h1"],
    label: "Heading 1",
    markdown: "#",
    type: "h1",
  },
  {
    icon: TextHTwoIcon,
    keywords: ["heading", "subtitle", "h2"],
    label: "Heading 2",
    markdown: "##",
    type: "h2",
  },
  {
    icon: TextHThreeIcon,
    keywords: ["heading", "h3"],
    label: "Heading 3",
    markdown: "###",
    type: "h3",
  },
  {
    icon: TextHFourIcon,
    keywords: ["heading", "h4"],
    label: "Heading 4",
    markdown: "####",
    type: "h4",
  },
  {
    icon: TextHFiveIcon,
    keywords: ["heading", "h5"],
    label: "Heading 5",
    markdown: "#####",
    type: "h5",
  },
  {
    icon: TextHSixIcon,
    keywords: ["heading", "h6"],
    label: "Heading 6",
    markdown: "######",
    type: "h6",
  },
  {
    icon: ListBulletsIcon,
    keywords: ["bulleted list", "unordered list", "ul"],
    label: "Bulleted list",
    markdown: "-",
    type: "bullet",
  },
  {
    icon: ListNumbersIcon,
    keywords: ["numbered list", "ordered list", "ol"],
    label: "Numbered list",
    markdown: "1.",
    type: "number",
  },
  {
    icon: ListChecksIcon,
    keywords: ["checklist", "todo", "task", "checkbox"],
    label: "Checklist",
    markdown: "[ ]",
    type: "check",
  },
  {
    icon: QuotesIcon,
    keywords: ["quote", "blockquote", "citation"],
    label: "Quote",
    markdown: ">",
    type: "quote",
  },
  {
    icon: CodeBlockIcon,
    keywords: ["code", "codeblock", "snippet", "pre"],
    label: "Code block",
    markdown: "```",
    type: "code",
  },
];

export const getBlockOption = (type: BlockType) =>
  BLOCK_OPTIONS.find((option) => option.type === type) ?? BLOCK_OPTIONS[0];

export const CALLOUT_ICONS: Record<CalloutKind, Icon> = {
  caution: WarningIcon,
  danger: WarningOctagonIcon,
  info: InfoIcon,
  note: NoteIcon,
  tip: LightbulbIcon,
};

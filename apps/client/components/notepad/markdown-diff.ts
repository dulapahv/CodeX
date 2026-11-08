/**
 * Applies markdown from source mode to the shared note, keeping every top
 * level block whose markdown didn't change so other people's carets and
 * edits there survive.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $isCodeNode } from "@lexical/code";
import { $isAutoLinkNode } from "@lexical/link";
import { $generateNodesFromMarkdownString } from "@lexical/markdown";
import {
  $createParagraphNode,
  $getRoot,
  $isElementNode,
  $isTextNode,
  $setSelection,
  type LexicalNode,
} from "lexical";

import { NOTEPAD_TRANSFORMERS } from "./markdown";
import { sanitizeTextStyle } from "./markdown-inline";

// Only what markdown keeps, so a block that round trips unchanged matches
// its freshly parsed copy
const SIGNATURE_KEYS = [
  "altText",
  "annotation",
  "caption",
  "checked",
  "color",
  "data",
  "date",
  "equation",
  "format",
  "headerState",
  "indent",
  "inline",
  "kind",
  "listType",
  "options",
  "provider",
  "question",
  "src",
  "start",
  "svg",
  "tag",
  "templateColumns",
  "url",
  "width",
];

// Auto links are plain text in markdown
const $flattenAutoLinks = (nodes: LexicalNode[]): LexicalNode[] =>
  nodes.flatMap((node) =>
    $isAutoLinkNode(node) ? $flattenAutoLinks(node.getChildren()) : [node]
  );

const getRunKey = (node: LexicalNode) =>
  $isTextNode(node) && node.getType() === "text"
    ? `${node.getFormat()}|${sanitizeTextStyle(node.getStyle())}`
    : null;

const $getChildrenSignature = (children: LexicalNode[]): string => {
  const parts: string[] = [];
  let run = null as { key: string; text: string } | null;
  for (const child of $flattenAutoLinks(children)) {
    const key = getRunKey(child);
    if (key !== null && run?.key === key) {
      run.text += child.getTextContent();
      continue;
    }
    if (run) {
      parts.push(`${run.key}:${run.text}`);
    }
    run = key === null ? null : { key, text: child.getTextContent() };
    if (!run) {
      parts.push($getSignature(child));
    }
  }
  if (run) {
    parts.push(`${run.key}:${run.text}`);
  }
  return parts.join(",");
};

const $getSignature = (node: LexicalNode): string => {
  if ($isCodeNode(node)) {
    return `code:${node.getLanguage() ?? ""}:${node.getTextContent()}`;
  }
  const json: Record<string, unknown> = node.exportJSON();
  const props = JSON.stringify(SIGNATURE_KEYS.map((key) => json[key]));
  const children = $isElementNode(node)
    ? $getChildrenSignature(node.getChildren())
    : node.getTextContent();
  return `${node.getType()}${props}[${children}]`;
};

// Maps each index of `next` in a longest common subsequence to its index in
// `current`
const matchBlocks = (current: string[], next: string[]) => {
  const width = next.length + 1;
  const lengths = new Uint32Array((current.length + 1) * width);
  for (let i = current.length - 1; i >= 0; i -= 1) {
    for (let j = next.length - 1; j >= 0; j -= 1) {
      lengths[i * width + j] =
        current[i] === next[j]
          ? lengths[(i + 1) * width + j + 1] + 1
          : Math.max(lengths[(i + 1) * width + j], lengths[i * width + j + 1]);
    }
  }

  const matches = new Map<number, number>();
  let i = 0;
  let j = 0;
  while (i < current.length && j < next.length) {
    if (current[i] === next[j]) {
      matches.set(j, i);
      i += 1;
      j += 1;
    } else if (lengths[(i + 1) * width + j] >= lengths[i * width + j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return matches;
};

export const $replaceWithMarkdown = (markdown: string) => {
  // The rich text view is hidden meanwhile, and its caret may sit in a block
  // that is about to go
  $setSelection(null);
  const root = $getRoot();
  const current = root.getChildren();
  const next = $generateNodesFromMarkdownString(markdown, NOTEPAD_TRANSFORMERS);
  const matches = matchBlocks(
    current.map($getSignature),
    next.map($getSignature)
  );

  const kept = new Set(matches.values());
  for (const [index, node] of current.entries()) {
    if (!kept.has(index)) {
      node.remove();
    }
  }

  let previous: LexicalNode | undefined;
  for (const [index, node] of next.entries()) {
    const match = matches.get(index);
    if (match !== undefined) {
      previous = current[match];
      continue;
    }
    if (previous) {
      previous.insertAfter(node);
    } else {
      const first = root.getFirstChild();
      if (first) {
        first.insertBefore(node);
      } else {
        root.append(node);
      }
    }
    previous = node;
  }

  if (root.isEmpty()) {
    root.append($createParagraphNode());
  }
};

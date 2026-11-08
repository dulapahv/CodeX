/**
 * Block and text formatting used by the toolbar, the floating toolbar and
 * the slash menu.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $createCodeNode, $isCodeNode } from "@lexical/code";
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $isTableSelection } from "@lexical/table";
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
} from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  type BaseSelection,
  type LexicalEditor,
} from "lexical";

export const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

export type BlockType =
  | "paragraph"
  | HeadingTagType
  | "bullet"
  | "number"
  | "check"
  | "quote"
  | "code";

export const $getBlockType = (selection: BaseSelection | null): BlockType => {
  if (!$isRangeSelection(selection)) {
    return "paragraph";
  }
  const anchorNode = selection.anchor.getNode();
  const element =
    anchorNode.getKey() === "root"
      ? anchorNode
      : ($findMatchingParent(anchorNode, (node) => {
          const parent = node.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        }) ?? anchorNode.getTopLevelElementOrThrow());

  if ($isListNode(element)) {
    const list = $getNearestNodeOfType(anchorNode, ListNode) ?? element;
    return list.getListType();
  }
  if ($isHeadingNode(element)) {
    return element.getTag();
  }
  if ($isQuoteNode(element)) {
    return "quote";
  }
  if ($isCodeNode(element)) {
    return "code";
  }
  return "paragraph";
};

const $formatParagraph = () => {
  $setBlocksType($getSelection(), () => $createParagraphNode());
};

const $formatCode = () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) {
    $setBlocksType(selection, () => $createCodeNode());
    return;
  }
  const text = selection.getTextContent();
  const code = $createCodeNode();
  selection.insertNodes([code]);
  code.select().insertRawText(text);
};

const LIST_COMMANDS = {
  bullet: INSERT_UNORDERED_LIST_COMMAND,
  check: INSERT_CHECK_LIST_COMMAND,
  number: INSERT_ORDERED_LIST_COMMAND,
} as const;

// Choosing the current list type again turns the list back into paragraphs
export const setBlockType = (
  editor: LexicalEditor,
  next: BlockType,
  current: BlockType
) => {
  if (next === "bullet" || next === "number" || next === "check") {
    if (next === current) {
      editor.update($formatParagraph);
    } else {
      editor.dispatchCommand(LIST_COMMANDS[next], undefined);
    }
    return;
  }
  if (next === current && next !== "paragraph") {
    return;
  }
  editor.update(() => {
    if (next === "paragraph") {
      $formatParagraph();
    } else if (next === "quote") {
      $setBlocksType($getSelection(), () => $createQuoteNode());
    } else if (next === "code") {
      $formatCode();
    } else {
      $setBlocksType($getSelection(), () => $createHeadingNode(next));
    }
  });
};

export const clearFormatting = (editor: LexicalEditor) => {
  editor.update(() => {
    const selection = $getSelection();
    if (!($isRangeSelection(selection) || $isTableSelection(selection))) {
      return;
    }
    for (const node of selection.extract()) {
      if ($isTextNode(node)) {
        node.setFormat(0);
        node.setStyle("");
        const block = $getNearestBlockElementAncestorOrThrow(node);
        if (block.getIndent() !== 0) {
          block.setIndent(0);
        }
      } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
        node.replace($createParagraphNode(), true);
      }
    }
    const cleared = $getSelection();
    if ($isRangeSelection(cleared)) {
      cleared.setFormat(0);
      cleared.setStyle("");
    }
  });
};

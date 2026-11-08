/**
 * Helpers shared by the notepad plugins for links, selections and floating
 * menus.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $isAtNodeEnd } from "@lexical/selection";
import type {
  ElementNode,
  LexicalEditor,
  RangeSelection,
  TextNode,
} from "lexical";

const SUPPORTED_URL_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "sms:",
  "tel:",
]);
const SINGLE_TOKEN = /^\S*\s*$/u;
const WWW_HOST = /^www\.\S/u;

const parseUrl = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

export const EMPTY_LINK_URL = "https://";

export const sanitizeUrl = (url: string): string => {
  const parsed = parseUrl(url);
  return parsed && !SUPPORTED_URL_PROTOCOLS.has(parsed.protocol)
    ? "about:blank"
    : url;
};

export const validateUrl = (url: string): boolean => {
  if (url === EMPTY_LINK_URL) {
    return true;
  }
  if (typeof url !== "string" || !SINGLE_TOKEN.test(url)) {
    return false;
  }
  const parsed =
    parseUrl(url) ?? (WWW_HOST.test(url) ? parseUrl(`https://${url}`) : null);
  return parsed !== null && SUPPORTED_URL_PROTOCOLS.has(parsed.protocol);
};

// The node a selection is "on", picking the end the user dragged towards
export const getSelectedNode = (
  selection: RangeSelection
): TextNode | ElementNode => {
  const { anchor, focus } = selection;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  if (selection.isBackward()) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  }
  return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
};

const VERTICAL_GAP = 8;
const HORIZONTAL_OFFSET = 4;

/**
 * Places a floating menu above or below `targetRect`, flipping when there is
 * no room and staying inside the scroll area. Positions are relative to
 * `anchorElem`, which scrolls with the note.
 */
export const setFloatingElemPosition = (
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  placement: "above" | "below" = "above"
) => {
  const scrollerElem = anchorElem.parentElement;
  if (!(targetRect && scrollerElem)) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }

  const floatingRect = floatingElem.getBoundingClientRect();
  const anchorRect = anchorElem.getBoundingClientRect();
  const scrollerRect = scrollerElem.getBoundingClientRect();

  const above = targetRect.top - floatingRect.height - VERTICAL_GAP;
  const below = targetRect.bottom + VERTICAL_GAP;
  let top = placement === "above" ? above : below;
  if (placement === "above" && above < scrollerRect.top) {
    top = below;
  } else if (
    placement === "below" &&
    below + floatingRect.height > scrollerRect.bottom &&
    above >= scrollerRect.top
  ) {
    top = above;
  }

  let left = targetRect.left - HORIZONTAL_OFFSET;
  if (left + floatingRect.width > scrollerRect.right) {
    left = scrollerRect.right - floatingRect.width - HORIZONTAL_OFFSET;
  }
  left = Math.max(left, scrollerRect.left + HORIZONTAL_OFFSET);

  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left - anchorRect.left}px, ${
    top - anchorRect.top
  }px)`;
};

// For a menu or dialog's finalFocus, so Lexical puts the caret back itself,
// unless the menu just opened a dialog that should keep the focus
export const restoreEditorFocus = (editor: LexicalEditor) => {
  if (!document.querySelector('[role="dialog"][data-open]')) {
    editor.focus();
  }
  return false;
};

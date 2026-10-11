/**
 * Writes the notepad's markdown into the shared Yjs text as the smallest
 * edit (common prefix and suffix kept), so edits in different places merge
 * instead of overwriting each other.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type * as Y from "yjs";

// Marks notepad writes so the notepad doesn't re-apply its own changes
export const NOTES_ORIGIN = Symbol("codex:notes");

const isHighSurrogate = (code: number) => code >= 0xd8_00 && code <= 0xdb_ff;
const isLowSurrogate = (code: number) => code >= 0xdc_00 && code <= 0xdf_ff;

export const replaceText = (text: Y.Text, next: string) => {
  const current = text.toString();
  if (current === next) {
    return;
  }

  let start = 0;
  const maxStart = Math.min(current.length, next.length);
  while (start < maxStart && current[start] === next[start]) {
    start++;
  }
  // Never split a surrogate pair
  if (start > 0 && isHighSurrogate(current.charCodeAt(start - 1))) {
    start--;
  }

  let end = 0;
  const maxEnd = Math.min(current.length, next.length) - start;
  while (end < maxEnd && current.at(-1 - end) === next.at(-1 - end)) {
    end++;
  }
  if (end > 0 && isLowSurrogate(current.charCodeAt(current.length - end))) {
    end--;
  }

  text.doc?.transact(() => {
    text.delete(start, current.length - start - end);
    text.insert(start, next.slice(start, next.length - end));
  }, NOTES_ORIGIN);
};

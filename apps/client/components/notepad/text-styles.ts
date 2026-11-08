/**
 * Fonts, sizes and colors the toolbar offers for text, and applying them to
 * the selection.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $patchStyleText } from "@lexical/selection";
import { $getSelection, type LexicalEditor } from "lexical";

export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 96;
export const FONT_SIZE_STEPS = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72,
  96,
];

// Values are written into the shared note, so they name portable fonts
export const FONT_FAMILIES = [
  { label: "Arial", value: "Arial" },
  { label: "Courier New", value: "Courier New" },
  { label: "Geist", value: "var(--font-geist-sans)" },
  { label: "Geist Mono", value: "var(--font-geist-mono)" },
  { label: "Georgia", value: "Georgia" },
  { label: "Monospace", value: "monospace" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Verdana", value: "Verdana" },
];

// Mid tones that read on both light and dark panels
export const TEXT_COLORS = [
  { label: "Gray", value: "#6b7280" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
];

// The same hues, see-through so the text stays readable on both themes
export const BACKGROUND_COLORS = TEXT_COLORS.map(({ label, value }) => ({
  label,
  value: `${value}59`,
}));

export const clampFontSize = (size: number) =>
  Math.min(Math.max(Math.round(size), MIN_FONT_SIZE), MAX_FONT_SIZE);

export const stepFontSize = (current: number, direction: 1 | -1) =>
  direction > 0
    ? (FONT_SIZE_STEPS.find((size) => size > current) ?? MAX_FONT_SIZE)
    : (FONT_SIZE_STEPS.findLast((size) => size < current) ?? MIN_FONT_SIZE);

// null removes the property, putting the text back to the default look
export const applyTextStyle = (
  editor: LexicalEditor,
  styles: Record<string, string | null>
) => {
  editor.update(() => {
    const selection = $getSelection();
    if (selection) {
      $patchStyleText(selection, styles);
    }
  });
};

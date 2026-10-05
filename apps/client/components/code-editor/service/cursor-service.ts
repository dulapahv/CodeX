/**
 * Monaco editor cursor management utilities.
 * Features:
 * - Multi-user cursor tracking
 * - Viewport line visibility checks
 * - Cursor style handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Cursor } from "@codex/types/operation";

import type { Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import type { RefObject } from "react";

import { storage } from "@/lib/services/storage";
import { userMap } from "@/lib/services/user-map";

import { createCursorStyle } from "../utils";

const VIEWPORT_PADDING = 0.1; // pixels to consider as padding when checking if line is in viewport
const CARET_HOVER_TOLERANCE = 4;

/**
 * Checks if a line number is within the editor's viewport
 */
const isLineInViewport = (
  monaco: Monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
  lineNumber: number,
  padding: number = VIEWPORT_PADDING
): boolean => {
  const visibleRanges = editor.getVisibleRanges();
  if (!visibleRanges.length) {
    return false;
  }

  // Get viewport information
  const viewportTop = visibleRanges[0].startLineNumber;
  const viewportBottom = visibleRanges.at(-1)?.endLineNumber ?? 0;

  // Convert padding to approximate line numbers
  const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
  const paddingLines = Math.ceil(padding / lineHeight);

  return (
    lineNumber >= viewportTop - paddingLines &&
    lineNumber <= viewportBottom + paddingLines
  );
};

/**
 * Show cursor and selection when other users type or select text.
 * @param userID User identifier
 * @param cursor Cursor data
 * @param editorInstanceRef Editor instance reference
 * @param monacoInstanceRef Monaco instance reference
 * @param cursorDecorationsRef Cursor decorations reference
 */
export const updateCursor = (
  userID: string,
  cursor: Cursor,
  editorInstanceRef: RefObject<monaco.editor.IStandaloneCodeEditor | null>,
  monacoInstanceRef: RefObject<Monaco | null>,
  cursorDecorationsRef: RefObject<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >
): void => {
  const editor = editorInstanceRef.current;
  const monacoInstance = monacoInstanceRef.current;
  if (!(editor && monacoInstance)) {
    return;
  }

  // Prevent duplicate cursor events
  if (storage.getFollowUserId() === userID) {
    const cursorLine = cursor[0];
    // Only center the line if it's outside the viewport
    if (!isLineInViewport(monacoInstance, editor, cursorLine)) {
      editor.revealLineInCenter(cursorLine);
    }
  }

  const name = userMap.get(userID) || "Unknown";

  // Clean up previous decoration
  cursorDecorationsRef.current[userID]?.clear();

  const { backgroundColor, color } = userMap.getColors(userID);
  const isFirstLine = cursor[0] === 1;

  const decorations: monaco.editor.IModelDeltaDecoration[] = [];

  // Add cursor decoration
  decorations.push({
    range: {
      startLineNumber: cursor[0],
      startColumn: cursor[1],
      endLineNumber: cursor[0],
      endColumn: cursor[1],
    },
    options: {
      className: `cursor-${userID}`,
      beforeContentClassName: "cursor-widget",
      stickiness:
        monacoInstance.editor.TrackedRangeStickiness
          .NeverGrowsWhenTypingAtEdges,
    },
  });

  // Add selection decoration if there is a selection
  const hasSelection =
    cursor[2] !== undefined &&
    cursor[3] !== undefined &&
    cursor[4] !== undefined &&
    cursor[5] !== undefined &&
    (cursor[2] !== cursor[4] || cursor[3] !== cursor[5]);

  if (hasSelection) {
    decorations.push({
      range: {
        startLineNumber: cursor[2] ?? 1,
        startColumn: cursor[3] ?? 1,
        endLineNumber: cursor[4] ?? 1,
        endColumn: cursor[5] ?? 1,
      },
      options: {
        className: `cursor-${userID}-selection`,
        minimap: {
          color: backgroundColor,
          position: monacoInstance.editor.MinimapPosition.Inline,
        },
        overviewRuler: {
          color: backgroundColor,
          position: monacoInstance.editor.OverviewRulerLane.Center,
        },
      },
    });
  }

  // Create decorations collection
  const cursorDecoration = editor.createDecorationsCollection(decorations);

  // Update styles
  const styleId = `cursor-style-${userID}`;
  let styleElement = document.getElementById(styleId);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = createCursorStyle(
    userID,
    backgroundColor,
    color,
    name,
    isFirstLine,
    hasSelection
  );

  // Store decoration
  cursorDecorationsRef.current[userID] = cursorDecoration;
};

/**
 * Reveal a remote cursor's name label while the mouse is over its caret.
 * @param editor Editor instance
 * @param cursorDecorationsRef Cursor decorations reference
 */
export const showLabelOnHover = (
  editor: monaco.editor.IStandaloneCodeEditor,
  cursorDecorationsRef: RefObject<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >
): monaco.IDisposable => {
  const root = editor.getDomNode();

  const setHovered = (userID?: string) => {
    if (!root) {
      return;
    }
    if (userID) {
      root.dataset.hoveredCursor = userID;
    } else {
      delete root.dataset.hoveredCursor;
    }
  };

  const isOverCaret = (
    range: monaco.IRange | null | undefined,
    x: number,
    y: number
  ) => {
    if (!range) {
      return false;
    }
    const caret = editor.getScrolledVisiblePosition({
      lineNumber: range.startLineNumber,
      column: range.startColumn,
    });
    return (
      caret !== null &&
      Math.abs(x - caret.left) <= CARET_HOVER_TOLERANCE &&
      y >= caret.top &&
      y <= caret.top + caret.height
    );
  };

  const moveDisposable = editor.onMouseMove(({ event }) => {
    if (!root) {
      return;
    }
    const rect = root.getBoundingClientRect();
    const x = event.browserEvent.clientX - rect.left;
    const y = event.browserEvent.clientY - rect.top;

    const hovered = Object.entries(cursorDecorationsRef.current).find(
      ([, decorations]) => isOverCaret(decorations.getRange(0), x, y)
    );
    setHovered(hovered?.[0]);
  });
  const leaveDisposable = editor.onMouseLeave(() => setHovered());

  return {
    dispose: () => {
      moveDisposable.dispose();
      leaveDisposable.dispose();
      setHovered();
    },
  };
};

/**
 * Remove cursor and selection when a user leaves.
 * @param userID User identifier.
 * @param cursorDecorationsRef Cursor decorations reference.
 */
export const removeCursor = (
  userID: string,
  cursorDecorationsRef: RefObject<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >
): void => {
  cursorDecorationsRef.current[userID]?.clear();
  delete cursorDecorationsRef.current[userID];
  document.getElementById(`cursor-style-${userID}`)?.remove();
};

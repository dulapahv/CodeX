/**
 * Monaco editor cursor management utilities.
 * Features:
 * - Multi-user cursor tracking
 * - Viewport line visibility checks
 * - Cursor style handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { RefObject } from 'react';

import type { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

import type { Cursor } from '@codex/types/operation';

import { storage } from '@/lib/services/storage';
import { userMap } from '@/lib/services/user-map';

import { createCursorStyle } from '../utils';

const VIEWPORT_PADDING = 0.1; // pixels to consider as padding when checking if line is in viewport

/**
 * Checks if a line number is within the editor's viewport
 */
const isLineInViewport = (
  monaco: Monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
  lineNumber: number,
  padding: number = VIEWPORT_PADDING,
): boolean => {
  const visibleRanges = editor.getVisibleRanges();
  if (!visibleRanges.length) return false;

  // Get viewport information
  const viewportTop = visibleRanges[0].startLineNumber;
  const viewportBottom = visibleRanges[visibleRanges.length - 1].endLineNumber;

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
 * @param cleanupTimeoutsRef Cleanup timeouts reference
 */
export const updateCursor = (
  userID: string,
  cursor: Cursor,
  editorInstanceRef: RefObject<monaco.editor.IStandaloneCodeEditor | null>,
  monacoInstanceRef: RefObject<Monaco | null>,
  cursorDecorationsRef: RefObject<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >,
  cleanupTimeoutsRef: RefObject<Record<string, NodeJS.Timeout>>,
): void => {
  const editor = editorInstanceRef.current;
  const monacoInstance = monacoInstanceRef.current;
  if (!editor || !monacoInstance) return;

  // Prevent duplicate cursor events
  if (storage.getFollowUserId() === userID) {
    const cursorLine = cursor[0];
    // Only center the line if it's outside the viewport
    if (!isLineInViewport(monacoInstance, editor, cursorLine)) {
      editor.revealLineInCenter(cursorLine);
    }
  }

  const name = userMap.get(userID) || 'Unknown';

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
      beforeContentClassName: 'cursor-widget',
      hoverMessage: { value: `${name}'s cursor` },
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
        hoverMessage: { value: `${name}'s selection` },
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
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = createCursorStyle(
    userID,
    backgroundColor,
    color,
    name,
    isFirstLine,
    hasSelection,
  );

  // Store decoration
  cursorDecorationsRef.current[userID] = cursorDecoration;

  // Remove any existing timeout if present
  if (cleanupTimeoutsRef.current[userID]) {
    clearTimeout(cleanupTimeoutsRef.current[userID]);
    delete cleanupTimeoutsRef.current[userID];
  }
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
  >,
): void => {
  const cursorElements = document.querySelectorAll(`.cursor-${userID}`);
  cursorElements.forEach((el) => el.remove());
  const selectionElements = document.querySelectorAll(
    `.cursor-${userID}-selection`,
  );
  selectionElements.forEach((el) => el.remove());

  cursorDecorationsRef.current[userID]?.clear();
};

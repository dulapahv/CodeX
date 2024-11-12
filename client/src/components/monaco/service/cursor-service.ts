/**
 * This file is responsible for showing the cursor and selection when other
 * users type or select text.
 *
 * This file contains 2 functions:
 * 1. updateCursor
 *    - Show cursor and selection when other users type or select text.
 * 2. removeCursor
 *    - Remove cursor and selection when a user leaves.
 *
 * Created by Dulapah Vibulsanti (https://github.com/dulapahv).
 */

import { MutableRefObject } from 'react';
import type { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import { Cursor } from '@common/types/operation';

import { userMap } from '@/lib/services/user-map';

import { createCursorStyle } from '../utils/create-cursor-style';

/**
 * Show cursor and selection when other users type or select text.
 * @param userID User identifier.
 * @param cursor Cursor data.
 * @param editorInstanceRef Editor instance reference.
 * @param monacoInstanceRef Monaco instance reference.
 * @param cursorDecorationsRef Cursor decorations reference.
 * @param cleanupTimeoutsRef Cleanup timeouts reference.
 */
export const updateCursor = (
  userID: string,
  cursor: Cursor,
  editorInstanceRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>,
  monacoInstanceRef: MutableRefObject<Monaco | null>,
  cursorDecorationsRef: MutableRefObject<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >,
  cleanupTimeoutsRef: MutableRefObject<Record<string, NodeJS.Timeout>>,
): void => {
  const editor = editorInstanceRef.current;
  const monacoInstance = monacoInstanceRef.current;
  if (!editor || !monacoInstance) return;

  const name = userMap.get(userID) || 'Unknown';

  // Clean up previous decoration
  cursorDecorationsRef.current[userID]?.clear();

  const { backgroundColor, color } = userMap.getColors(userID);
  const isFirstLine = cursor.pL === 1;

  const decorations: monaco.editor.IModelDeltaDecoration[] = [];

  // Add cursor decoration
  decorations.push({
    range: {
      startLineNumber: cursor.pL,
      startColumn: cursor.pC,
      endLineNumber: cursor.pL,
      endColumn: cursor.pC,
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
    cursor.sL !== undefined &&
    cursor.sC !== undefined &&
    cursor.eL !== undefined &&
    cursor.eC !== undefined &&
    (cursor.sL !== cursor.eL || cursor.sC !== cursor.eC);

  if (hasSelection) {
    decorations.push({
      range: {
        startLineNumber: cursor.sL ?? 1,
        startColumn: cursor.sC ?? 1,
        endLineNumber: cursor.eL ?? 1,
        endColumn: cursor.eC ?? 1,
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
  cursorDecorationsRef: MutableRefObject<
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

/**
 * Monaco editor service functions for editor lifecycle and configuration.
 * Features:
 * - Theme management
 * - Editor initialization
 * - Event handling
 * - Socket integration
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, RefObject, SetStateAction } from 'react';

import type { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import themeList from 'monaco-themes/themes/themelist.json';

import { CodeServiceMsg, ScrollServiceMsg } from '@codex/types/message';
import type { Cursor, EditOp } from '@codex/types/operation';

import { EDITOR_SETTINGS_KEY } from '@/lib/constants';
import { storage } from '@/lib/services/storage';
import { getSocket } from '@/lib/socket';
import type { StatusBarCursorPosition } from '@/components/status-bar';

/**
 * Handle the Monaco editor before mounting.
 * @param monaco Monaco instance.
 */
export const handleBeforeMount = (monaco: Monaco): void => {
  Object.entries(themeList).forEach(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const themeData = require(`monaco-themes/themes/${value}.json`);
    monaco.editor.defineTheme(key, themeData);
  });
};

/**
 * Handle the Monaco editor after mounting.
 * @param editor Monaco editor instance
 * @param monaco Monaco instance
 * @param editorRef Editor reference function
 * @param monacoRef Monaco reference function
 * @param editorInstanceRef Editor instance reference
 */
export const handleOnMount = (
  editor: monaco.editor.IStandaloneCodeEditor,
  monaco: Monaco,
  disposablesRef: RefObject<monaco.IDisposable[]>,
  setCursorPosition: Dispatch<SetStateAction<StatusBarCursorPosition>>,
  defaultCode?: string,
): void => {
  const socket = getSocket();

  if (defaultCode) {
    editor.setValue(defaultCode);
  }
  editor.focus();

  editor.updateOptions({
    cursorSmoothCaretAnimation: 'on',
    fontFamily: "GeistMono, Consolas, 'Courier New', monospace",
  });

  const savedSettings = localStorage.getItem(EDITOR_SETTINGS_KEY);

  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings) as Record<string, unknown>;
      editor.updateOptions(parsed);
    } catch (error) {
      console.error('Failed to load saved settings:', error);
    }
  }

  editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF);

  // Disable unwanted validations
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    diagnosticCodesToIgnore: [
      // 2304, // Ignore "Cannot find name" error
      // 2339, // Ignore "Property does not exist" error
      2792, // Ignore "Cannot find module" error
    ],
  });

  const cursorSelectionDisposable = editor.onDidChangeCursorSelection((e) => {
    setCursorPosition({
      line: e.selection.positionLineNumber,
      column: e.selection.positionColumn,
      selected: editor.getModel()?.getValueLengthInRange(e.selection) || 0,
    });

    // If the selection is empty, send only the cursor position
    if (
      e.selection.startLineNumber === e.selection.endLineNumber &&
      e.selection.startColumn === e.selection.endColumn
    ) {
      socket.emit(CodeServiceMsg.UPDATE_CURSOR, [
        e.selection.positionLineNumber,
        e.selection.positionColumn,
      ] as Cursor);
    } else {
      socket.emit(CodeServiceMsg.UPDATE_CURSOR, [
        e.selection.positionLineNumber,
        e.selection.positionColumn,
        e.selection.startLineNumber,
        e.selection.startColumn,
        e.selection.endLineNumber,
        e.selection.endColumn,
      ] as Cursor);
    }
  });

  const scrollDisposable = editor.onDidScrollChange((e) => {
    if (storage.getFollowUserId()) return; // If following another user, do not emit scroll events
    socket.emit(ScrollServiceMsg.UPDATE_SCROLL, [e.scrollLeft, e.scrollTop]);
  });

  disposablesRef.current.push(cursorSelectionDisposable);
  disposablesRef.current.push(scrollDisposable);
};

/**
 * Handle changes in the editor.
 * @param value Current value in the editor.
 * @param ev Editor change event.
 * @param skipUpdateRef Skip update reference.
 */
export const handleOnChange = (
  value: string | undefined,
  ev: monaco.editor.IModelContentChangedEvent,
  skipUpdateRef: RefObject<boolean>,
): void => {
  if (skipUpdateRef.current) return;
  const socket = getSocket();

  ev.changes.forEach((change) => {
    socket.emit(CodeServiceMsg.UPDATE_CODE, [
      change.text,
      change.range.startLineNumber,
      change.range.startColumn,
      change.range.endLineNumber,
      change.range.endColumn,
    ] as EditOp);
  });
};

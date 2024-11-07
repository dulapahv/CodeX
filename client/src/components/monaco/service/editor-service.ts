/**
 * This file is responsible for handling the Monaco editor before and
 * after mounting.
 *
 * This file contains 3 functions:
 * 1. handleBeforeMount
 *    - Handle the Monaco editor before mounting.
 * 2. handleOnMount
 *   - Handle the Monaco editor after mounting.
 * 3. handleOnChange
 *   - Handle changes in the editor.
 *
 * Created by Dulapah Vibulsanti (https://github.com/dulapahv).
 */

import React, { MutableRefObject } from "react";
import * as monaco from "monaco-editor";
import themeList from "monaco-themes/themes/themelist.json";

import type { Monaco } from "@monaco-editor/react";
import { socket } from "@/lib/socket";

import type { statusBar } from "../types/status-bar";
import {
  CodeServiceMsg,
  UserServiceMsg,
} from "../../../../../common/types/message";
import { Cursor, EditOp } from "../../../../../common/types/operation";

/**
 * Handle the Monaco editor before mounting.
 * @param monaco Monaco instance.
 */
export const handleBeforeMount = (monaco: Monaco): void => {
  Object.entries(themeList).forEach(([key, value]) => {
    const themeData = require(`monaco-themes/themes/${value}.json`);
    monaco.editor.defineTheme(key, themeData);
  });
};

/**
 * Handle the Monaco editor after mounting.
 * @param editor Monaco editor instance.
 * @param monaco Monaco instance.
 * @param editorRef Editor reference function.
 * @param monacoRef Monaco reference function.
 * @param editorInstanceRef Editor instance reference.
 * @param monacoInstanceRef Monaco instance reference.
 * @param disposablesRef Disposables reference.
 * @param setCursorPosition Set cursor position function.
 * @param defaultCode Default code to set in the editor.
 */
export const handleOnMount = (
  editor: monaco.editor.IStandaloneCodeEditor,
  monaco: Monaco,
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void,
  monacoRef: (monaco: Monaco) => void,
  editorInstanceRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>,
  monacoInstanceRef: MutableRefObject<Monaco | null>,
  disposablesRef: MutableRefObject<monaco.IDisposable[]>,
  setCursorPosition: React.Dispatch<React.SetStateAction<statusBar>>,
  defaultCode?: string,
): void => {
  editorRef(editor);
  monacoRef(monaco);
  editorInstanceRef.current = editor;
  monacoInstanceRef.current = monaco;

  if (defaultCode) {
    editor.setValue(defaultCode);
  }
  editor.focus();
  editor.updateOptions({ cursorSmoothCaretAnimation: "on" });

  const cursorSelectionDisposable = editor.onDidChangeCursorSelection((ev) => {
    setCursorPosition({
      line: ev.selection.positionLineNumber,
      column: ev.selection.positionColumn,
      selected: editor.getModel()?.getValueLengthInRange(ev.selection) || 0,
    });

    // If the selection is empty, send only the cursor position
    if (
      ev.selection.startLineNumber === ev.selection.endLineNumber &&
      ev.selection.startColumn === ev.selection.endColumn
    ) {
      socket.emit(UserServiceMsg.CURSOR_TX, {
        pL: ev.selection.positionLineNumber,
        pC: ev.selection.positionColumn,
      } as Cursor);
    } else {
      socket.emit(UserServiceMsg.CURSOR_TX, {
        pL: ev.selection.positionLineNumber,
        pC: ev.selection.positionColumn,
        sL: ev.selection.startLineNumber,
        sC: ev.selection.startColumn,
        eL: ev.selection.endLineNumber,
        eC: ev.selection.endColumn,
      } as Cursor);
    }
  });

  disposablesRef.current.push(cursorSelectionDisposable);
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
  skipUpdateRef: MutableRefObject<boolean>,
): void => {
  if (skipUpdateRef.current) return;
  ev.changes.forEach((change) => {
    socket.emit(CodeServiceMsg.CODE_TX, {
      t: change.text,
      r: {
        sL: change.range.startLineNumber,
        sC: change.range.startColumn,
        eL: change.range.endLineNumber,
        eC: change.range.endColumn,
      },
    } as EditOp);
  });
};

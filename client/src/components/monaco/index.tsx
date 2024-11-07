import { memo, useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import themeList from "monaco-themes/themes/themelist.json";
import { useTheme } from "next-themes";

import type { Monaco } from "@monaco-editor/react";
import { userMap } from "@/lib/services/user-map";
import { socket } from "@/lib/socket";

import {
  CodeServiceMsg,
  RoomServiceMsg,
  UserServiceMsg,
} from "../../../../common/types/message";
import { Cursor, EditOp } from "../../../../common/types/operation";
import { LoadingAlert } from "./components/loading-alert";
import { createCursorStyle } from "./utils/create-cursor-style";

interface MonacoEditorProps {
  monacoRef: (monaco: Monaco) => void;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  defaultCode?: string;
}

export const MonacoEditor = memo(function MonacoEditor({
  monacoRef,
  editorRef,
  defaultCode,
}: MonacoEditorProps) {
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState<string>("vs-dark");
  const [cursorPosition, setCursorPosition] = useState({
    line: 1,
    column: 1,
    selected: 0,
  });

  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const monacoInstanceRef = useRef<Monaco | null>(null);
  const skipUpdateRef = useRef(false);
  const cursorDecorationsRef = useRef<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >({});
  const cleanupTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  // Initialize editor theme
  useEffect(() => {
    const storedTheme =
      localStorage.getItem("editorTheme") ||
      (resolvedTheme === "dark" ? "vs-dark" : "light");
    setTheme(storedTheme);
    localStorage.setItem("editorTheme", storedTheme);
  }, [resolvedTheme]);

  // Apply theme changes
  useEffect(() => {
    editorInstanceRef.current?.updateOptions({ theme });
  }, [theme]);

  // Setup socket event listeners
  useEffect(() => {
    socket.on(CodeServiceMsg.CODE_RX, (op: EditOp) => {
      const editor = editorInstanceRef.current;
      if (!editor) return;

      skipUpdateRef.current = true;
      const model = editor.getModel();
      if (model) {
        model.pushEditOperations(
          [],
          [
            {
              forceMoveMarkers: true,
              range: {
                startLineNumber: op.r.sL,
                startColumn: op.r.sC,
                endLineNumber: op.r.eL,
                endColumn: op.r.eC,
              },
              text: op.t,
            },
          ],
          () => [],
        );
      }
      skipUpdateRef.current = false;
    });

    socket.on(UserServiceMsg.CURSOR_RX, handleCursorUpdate);

    socket.on(RoomServiceMsg.USER_LEFT, (userID: string) => {
      const cursorElements = document.querySelectorAll(`.cursor-${userID}`);
      cursorElements.forEach((el) => el.remove());
      const selectionElements = document.querySelectorAll(
        `.cursor-${userID}-selection`,
      );
      selectionElements.forEach((el) => el.remove());

      cursorDecorationsRef.current[userID]?.clear();
    });

    // Cleanup socket listeners
    return () => {
      socket.off(CodeServiceMsg.CODE_RX);
      socket.off(UserServiceMsg.CURSOR_RX);
      socket.off(RoomServiceMsg.USER_LEFT);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up Monaco disposables
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];

      // Clean up decorations
      Object.values(cursorDecorationsRef.current).forEach((decoration) =>
        decoration.clear(),
      );
      cursorDecorationsRef.current = {};

      // Clean up timeouts
      Object.values(cleanupTimeoutsRef.current).forEach((timeout) =>
        clearTimeout(timeout),
      );
      cleanupTimeoutsRef.current = {};
    };
  }, []);

  const handleEditorWillMount = useCallback((monaco: Monaco) => {
    Object.entries(themeList).forEach(([key, value]) => {
      const themeData = require(`monaco-themes/themes/${value}.json`);
      monaco.editor.defineTheme(key, themeData);
    });
  }, []);

  const handleCursorUpdate = useCallback((userID: string, cursor: Cursor) => {
    const editor = editorInstanceRef.current;
    const monacoInstance = monacoInstanceRef.current;
    if (!editor || !monacoInstance) return;

    const name = userMap.get(userID) || "Unknown";

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
        beforeContentClassName: "cursor-widget",
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
      hasSelection,
    );

    // Store decoration
    cursorDecorationsRef.current[userID] = cursorDecoration;

    // Remove any existing timeout if present
    if (cleanupTimeoutsRef.current[userID]) {
      clearTimeout(cleanupTimeoutsRef.current[userID]);
      delete cleanupTimeoutsRef.current[userID];
    }

    // Set cleanup timeout only if there's no selection
    if (!hasSelection) {
      cleanupTimeoutsRef.current[userID] = setTimeout(() => {
        cursorDecoration.clear();
        delete cursorDecorationsRef.current[userID];
        styleElement?.remove();
        delete cleanupTimeoutsRef.current[userID];
      }, 3000);
    }
  }, []);

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
      try {
        editorRef(editor);
        monacoRef(monaco);
        editorInstanceRef.current = editor;
        monacoInstanceRef.current = monaco;

        if (defaultCode) {
          editor.setValue(defaultCode);
        }
        editor.focus();
        editor.updateOptions({ cursorSmoothCaretAnimation: "on" });

        const cursorSelectionDisposable = editor.onDidChangeCursorSelection(
          (ev) => {
            setCursorPosition({
              line: ev.selection.positionLineNumber,
              column: ev.selection.positionColumn,
              selected:
                editor.getModel()?.getValueLengthInRange(ev.selection) || 0,
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
          },
        );

        disposablesRef.current.push(cursorSelectionDisposable);
      } catch (error) {
        console.error("Error mounting editor:", error);
      }
    },
    [editorRef, monacoRef, defaultCode],
  );

  const handleChange = useCallback(
    (
      value: string | undefined,
      ev: monaco.editor.IModelContentChangedEvent,
    ) => {
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
    },
    [],
  );

  return (
    <>
      <div className="h-[calc(100%-24px)] animate-fade-in">
        <Editor
          defaultLanguage="javascript"
          theme={theme}
          loading={<LoadingAlert />}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={handleChange}
        />
      </div>
      <section className="absolute bottom-0 h-6 w-full animate-fade-in bg-[#2678ca] py-1">
        <div className="flex justify-end text-xs text-neutral-100">
          <div className="px-2">
            {`Ln ${cursorPosition.line}, Col ${cursorPosition.column} ${
              cursorPosition.selected
                ? `(${cursorPosition.selected} selected)`
                : ""
            }`}
          </div>
        </div>
      </section>
    </>
  );
});

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import themeList from "monaco-themes/themes/themelist.json";

import type { Monaco } from "@monaco-editor/react";
import { socket } from "@/lib/socket";

import type { Cursor } from "../../../../common/types/operation";
import type { CursorPosition, MonacoEditorProps } from "./types";
import {
  CodeServiceMsg,
  UserServiceMsg,
} from "../../../../common/types/message";
import { EditOp } from "../../../../common/types/operation";
import { LoadingAlert } from "./components/LoadingAlert";
import { CURSOR_STYLES } from "./constants";
import { useMonacoCursors } from "./hooks/useMonacoCursors";
import { useMonacoTheme } from "./hooks/useMonacoTheme";

export const MonacoEditor = memo(function MonacoEditor({
  monacoRef,
  editorRef,
  defaultCode,
}: MonacoEditorProps) {
  const { theme, setTheme } = useMonacoTheme();
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 1,
    column: 1,
    selected: 0,
  });

  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const monacoInstanceRef = useRef<Monaco | null>(null);
  const skipUpdateRef = useRef(false);
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  const { handleCursorUpdate, cursorDecorationsRef, cleanupTimeoutsRef } =
    useMonacoCursors();

  useEffect(() => {
    editorInstanceRef.current?.updateOptions({ theme });
  }, [theme]);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = CURSOR_STYLES;
    document.head.appendChild(styleElement);
    return () => styleElement.remove();
  }, []);

  useEffect(() => {
    const socketInstance = socket();

    socketInstance.on(CodeServiceMsg.CODE_RX, (op: EditOp) => {
      const editor = editorInstanceRef.current;
      if (!editor) return;

      try {
        skipUpdateRef.current = true;
        const model = editor.getModel();
        if (model) {
          model.pushEditOperations(
            [],
            [
              {
                forceMoveMarkers: true,
                range: op.range,
                text: op.text,
              },
            ],
            () => [],
          );
        }
      } catch (error) {
        console.error("Error applying edit operation:", error);
      } finally {
        skipUpdateRef.current = false;
      }
    });

    socketInstance.on(
      UserServiceMsg.CURSOR_RX,
      (name: string, cursor: Cursor) => {
        const editor = editorInstanceRef.current;
        const monacoInstance = monacoInstanceRef.current;
        if (editor && monacoInstance) {
          handleCursorUpdate(name, cursor, editor, monacoInstance);
        }
      },
    );

    return () => {
      socketInstance.off(CodeServiceMsg.CODE_RX);
      socketInstance.off(UserServiceMsg.CURSOR_RX);
    };
  }, [handleCursorUpdate]);

  useEffect(() => {
    return () => {
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];

      Object.values(cursorDecorationsRef.current).forEach((decoration) =>
        decoration.clear(),
      );
      Object.values(cleanupTimeoutsRef.current).forEach((timeout) =>
        clearTimeout(timeout),
      );
    };
  }, []);

  const handleEditorWillMount = useCallback((monaco: Monaco) => {
    try {
      Object.entries(themeList).forEach(([key, value]) => {
        const themeData = require(`monaco-themes/themes/${value}.json`);
        monaco.editor.defineTheme(key, themeData);
      });
    } catch (error) {
      console.error("Error loading editor themes:", error);
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

        const cursorPositionDisposable = editor.onDidChangeCursorPosition(
          (ev) => {
            setCursorPosition((prev) => ({
              ...prev,
              line: ev.position.lineNumber,
              column: ev.position.column,
            }));
            console.log(ev)
            socket().emit(
              UserServiceMsg.CURSOR_TX,
              sessionStorage.getItem("roomId"),
              {
                line: ev.position.lineNumber,
                column: ev.position.column,
              },
            );
          },
        );

        const cursorSelectionDisposable = editor.onDidChangeCursorSelection(
          (ev) => {
            console.log(ev);
          },
        );

        disposablesRef.current.push(
          cursorPositionDisposable,
          cursorSelectionDisposable,
        );
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
      try {
        ev.changes.forEach((change) => {
          socket().emit(
            CodeServiceMsg.CODE_TX,
            sessionStorage.getItem("roomId"),
            change,
          );
        });
      } catch (error) {
        console.error("Error handling editor change:", error);
      }
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

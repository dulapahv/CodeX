import { memo, useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { LoaderCircle } from "lucide-react";
import * as monaco from "monaco-editor";
import themeList from "monaco-themes/themes/themelist.json";
import { useTheme } from "next-themes";

import type { Monaco } from "@monaco-editor/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { COLORS } from "@/lib/constants";
import { socket } from "@/lib/socket";
import { hashString } from "@/lib/utils";

import {
  CodeServiceMsg,
  UserServiceMsg,
} from "../../../../common/types/message";
import { Cursor, EditOp } from "../../../../common/types/operation";

interface MonacoEditorProps {
  monacoRef: (monaco: Monaco) => void;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  defaultCode?: string;
}

const LoadingAlert = memo(() => (
  <Alert className="max-w-md">
    <LoaderCircle className="size-5 animate-spin" />
    <AlertTitle>Setting up editor</AlertTitle>
    <AlertDescription>
      Setting up the editor for you. Please wait...
    </AlertDescription>
  </Alert>
));

LoadingAlert.displayName = "LoadingAlert";

const createSafeClassName = (name: string) =>
  `cursor-${name.replace(/[^a-zA-Z0-9]/g, "-")}`;

const createCursorStyle = (
  className: string,
  color: string,
  name: string,
  isFirstLine: boolean = false,
  hasSelection: boolean = false,
) => `
  .${className} {
    background-color: ${color} !important;
    width: 2px !important;
  }
  .${className}::after {
    content: "${name.replace(/"/g, '\\"')}";
    background-color: ${color};
    position: absolute;
    top: ${isFirstLine ? "19px" : "-19px"};
    height: 19px;
    font-size: 12px;
    padding: 0 4px;
    ${isFirstLine ? "border-radius: 0px 3px 3px 3px;" : "border-radius: 3px 3px 3px 0px;"}
    white-space: nowrap;
    color: white;
    z-index: 100;
    ${
      !hasSelection
        ? `
    animation: cursorFadeOut 0.2s ease-in forwards;
    animation-delay: 2.7s;`
        : ""
    }
  }
  .${className}-selection {
    background-color: ${color}50 !important;
  }`;

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
    const socketInstance = socket();

    socketInstance.on(CodeServiceMsg.CODE_RX, (op: EditOp) => {
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
              range: op.range,
              text: op.text,
            },
          ],
          () => [],
        );
      }
      skipUpdateRef.current = false;
    });

    socketInstance.on(UserServiceMsg.CURSOR_RX, handleCursorUpdate);

    // Cleanup socket listeners
    return () => {
      socketInstance.off(CodeServiceMsg.CODE_RX);
      socketInstance.off(UserServiceMsg.CURSOR_RX);
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

  const handleCursorUpdate = useCallback((name: string, cursor: Cursor) => {
    const editor = editorInstanceRef.current;
    const monacoInstance = monacoInstanceRef.current;
    if (!editor || !monacoInstance) return;

    // Clean up previous decoration
    cursorDecorationsRef.current[name]?.clear();

    const color = COLORS[hashString(name) % COLORS.length];
    const safeClassName = createSafeClassName(name);
    const isFirstLine = cursor.positionLineNumber === 1;

    const decorations = [];

    // Add cursor decoration
    decorations.push({
      range: new monacoInstance.Range(
        cursor.positionLineNumber,
        cursor.positionColumn,
        cursor.positionLineNumber,
        cursor.positionColumn,
      ),
      options: {
        className: safeClassName,
        beforeContentClassName: "cursor-widget",
        stickiness:
          monacoInstance.editor.TrackedRangeStickiness
            .NeverGrowsWhenTypingAtEdges,
      },
    });

    // Add selection decoration if there is a selection
    const hasSelection =
      cursor.startLineNumber !== undefined &&
      cursor.startColumn !== undefined &&
      cursor.endLineNumber !== undefined &&
      cursor.endColumn !== undefined &&
      (cursor.startLineNumber !== cursor.endLineNumber ||
        cursor.startColumn !== cursor.endColumn);

    if (hasSelection) {
      decorations.push({
        range: new monacoInstance.Range(
          cursor.startLineNumber ?? 1,
          cursor.startColumn ?? 1,
          cursor.endLineNumber ?? 1,
          cursor.endColumn ?? 1,
        ),
        options: {
          className: `${safeClassName}-selection`,
          stickiness:
            monacoInstance.editor.TrackedRangeStickiness
              .NeverGrowsWhenTypingAtEdges,
          hoverMessage: { value: `${name}'s selection` },
        },
      });
    }

    // Create decorations collection
    const cursorDecoration = editor.createDecorationsCollection(decorations);

    // Update styles
    const styleId = `cursor-style-${safeClassName}`;
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = createCursorStyle(
      safeClassName,
      color,
      name,
      isFirstLine,
      hasSelection,
    );

    // Store decoration
    cursorDecorationsRef.current[name] = cursorDecoration;

    // Remove any existing timeout if present
    if (cleanupTimeoutsRef.current[name]) {
      clearTimeout(cleanupTimeoutsRef.current[name]);
      delete cleanupTimeoutsRef.current[name];
    }

    // Set cleanup timeout only if there's no selection
    if (!hasSelection) {
      cleanupTimeoutsRef.current[name] = setTimeout(() => {
        cursorDecoration.clear();
        delete cursorDecorationsRef.current[name];
        styleElement?.remove();
        delete cleanupTimeoutsRef.current[name];
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
              socket().emit(
                UserServiceMsg.CURSOR_TX,
                sessionStorage.getItem("roomId"),
                {
                  positionLineNumber: ev.selection.positionLineNumber,
                  positionColumn: ev.selection.positionColumn,
                } as Cursor,
              );
            } else {
              socket().emit(
                UserServiceMsg.CURSOR_TX,
                sessionStorage.getItem("roomId"),
                {
                  positionLineNumber: ev.selection.positionLineNumber,
                  positionColumn: ev.selection.positionColumn,
                  startLineNumber: ev.selection.startLineNumber,
                  startColumn: ev.selection.startColumn,
                  endLineNumber: ev.selection.endLineNumber,
                  endColumn: ev.selection.endColumn,
                } as Cursor,
              );
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
        socket().emit(
          CodeServiceMsg.CODE_TX,
          sessionStorage.getItem("roomId"),
          change,
        );
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

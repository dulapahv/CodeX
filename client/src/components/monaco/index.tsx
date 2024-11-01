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

const CURSOR_STYLES = `
.cursor-widget {
  width: 2px;
  height: 18px;
  position: absolute;
}

.cursor-label {
  position: absolute;
  top: -18px;
  left: 4px;
  font-size: 12px;
  padding: 0 4px;
  border-radius: 3px;
  white-space: nowrap;
  color: white;
  z-index: 100;
}

@keyframes cursorFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}`;

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
) => `
  .${className} {
    background-color: ${color} !important;
    width: 2px !important;
  }
  .${className}::after {
    content: "${name.replace(/"/g, '\\"')}";
    background-color: ${color};
    position: absolute;
    top: ${isFirstLine ? "18px" : "-18px"};
    left: 4px;
    font-size: 12px;
    padding: 0 4px;
    border-radius: 3px;
    white-space: nowrap;
    color: white;
    z-index: 100;
    animation: cursorFadeOut 0.2s ease-in forwards;
    animation-delay: 2.7s;
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

  // Initialize cursor styles
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = CURSOR_STYLES;
    document.head.appendChild(styleElement);
    return () => styleElement.remove();
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    const socketInstance = socket();

    socketInstance.on(CodeServiceMsg.RECEIVE_EDIT, (op: EditOp) => {
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

    socketInstance.on(UserServiceMsg.RECEIVE_CURSOR, handleCursorUpdate);

    // Cleanup socket listeners
    return () => {
      socketInstance.off(CodeServiceMsg.RECEIVE_EDIT);
      socketInstance.off(UserServiceMsg.RECEIVE_CURSOR);
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
    const isFirstLine = cursor.line === 1;

    // Create cursor decoration
    const cursorDecoration = editor.createDecorationsCollection([
      {
        range: new monacoInstance.Range(
          cursor.line,
          cursor.column,
          cursor.line,
          cursor.column,
        ),
        options: {
          className: safeClassName,
          beforeContentClassName: "cursor-widget",
          isWholeLine: false,
          stickiness:
            monacoInstance.editor.TrackedRangeStickiness
              .NeverGrowsWhenTypingAtEdges,
          inlineClassName: safeClassName,
          hoverMessage: { value: `${name}'s cursor` },
        },
      },
    ]);

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
    );

    // Store decoration and setup cleanup
    cursorDecorationsRef.current[name] = cursorDecoration;

    if (cleanupTimeoutsRef.current[name]) {
      clearTimeout(cleanupTimeoutsRef.current[name]);
    }

    cleanupTimeoutsRef.current[name] = setTimeout(() => {
      cursorDecoration.clear();
      delete cursorDecorationsRef.current[name];
      styleElement?.remove();
      delete cleanupTimeoutsRef.current[name];
    }, 3000);
  }, []);

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef(editor);
      monacoRef(monaco);
      editorInstanceRef.current = editor;
      monacoInstanceRef.current = monaco;

      if (defaultCode) {
        editor.setValue(defaultCode);
      }
      editor.focus();
      editor.updateOptions({ cursorSmoothCaretAnimation: "on" });

      // Setup Monaco event listeners
      const cursorPositionDisposable = editor.onDidChangeCursorPosition(
        (ev) => {
          setCursorPosition((prev) => ({
            ...prev,
            line: ev.position.lineNumber,
            column: ev.position.column,
          }));
          socket().emit(
            UserServiceMsg.SEND_CURSOR,
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
          const selection =
            editor.getModel()?.getValueLengthInRange(ev.selection) ?? 0;
          setCursorPosition((prev) => ({ ...prev, selected: selection }));
        },
      );

      // Store disposables for cleanup
      disposablesRef.current.push(
        cursorPositionDisposable,
        cursorSelectionDisposable,
      );
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
          CodeServiceMsg.SEND_EDIT,
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

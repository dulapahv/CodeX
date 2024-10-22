import { useCallback, useEffect, useRef, useState } from "react";
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

interface MonacoProps {
  monacoRef: (monaco: Monaco) => void;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  defaultCode?: string;
}

// Add styles to your global CSS file
const cursorStyles = `
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
`;

export function Monaco({ monacoRef, editorRef, defaultCode }: MonacoProps) {
  const { resolvedTheme } = useTheme();

  const [theme, setTheme] = useState<string | undefined>("vs-dark");
  const [line, setLine] = useState(1);
  const [column, setColumn] = useState(1);
  const [selected, setSelected] = useState(0);

  const editorInternalRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const monacoInternalRef = useRef<Monaco | null>(null);
  const skipUpdateRef = useRef(false);

  // Keep track of cursor decorations for each user
  const cursorDecorationsRef = useRef<{
    [key: string]: monaco.editor.IEditorDecorationsCollection;
  }>({});

  useEffect(() => {
    // Add cursor styles to document
    const styleElement = document.createElement("style");
    styleElement.textContent = cursorStyles;
    document.head.appendChild(styleElement);

    return () => {
      styleElement.remove();
    };
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("editorTheme");
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const systemTheme = resolvedTheme === "dark" ? "vs-dark" : "light";
      setTheme(systemTheme);
      localStorage.setItem("editorTheme", systemTheme);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (editorInternalRef.current && theme) {
      editorInternalRef.current.updateOptions({ theme });
    }
  }, [theme]);

  // Cleanup decorations when component unmounts
  useEffect(() => {
    return () => {
      Object.values(cursorDecorationsRef.current).forEach((decoration) => {
        decoration.clear();
      });
    };
  }, []);

  function handleEditorWillMount(monaco: Monaco) {
    // Register themes
    Object.entries(themeList).forEach(([key, value]) => {
      const json = require(`monaco-themes/themes/${value}.json`);
      monaco.editor.defineTheme(key, json);
    });
  }

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef(editor);
      monacoRef(monaco);

      editorInternalRef.current = editor;
      monacoInternalRef.current = monaco;

      if (defaultCode) {
        editor.setValue(defaultCode);
      }

      editor.focus();

      // Handle cursor position and selection
      editor.onDidChangeCursorPosition(
        (ev: monaco.editor.ICursorPositionChangedEvent) => {
          setLine(ev.position.lineNumber);
          setColumn(ev.position.column);
          socket().emit(
            UserServiceMsg.SEND_CURSOR,
            sessionStorage.getItem("roomId"),
            {
              line: ev.position.lineNumber,
              column: ev.position.column,
            } as Cursor,
          );
        },
      );

      // Handle selection
      editor.onDidChangeCursorSelection(
        (ev: monaco.editor.ICursorSelectionChangedEvent) => {
          const selection = editor
            .getModel()
            ?.getValueLengthInRange(ev.selection);
          if (selection) {
            setSelected(selection);
          } else {
            setSelected(0);
          }
        },
      );

      // Handle incoming changes from the server
      socket().on(CodeServiceMsg.RECEIVE_EDIT, (op: EditOp) => {
        skipUpdateRef.current = true;
        const model = editor.getModel();
        if (model) {
          const ops: monaco.editor.IIdentifiedSingleEditOperation[] = [];
          ops.push({
            forceMoveMarkers: true,
            range: {
              startLineNumber: op.range.startLineNumber,
              startColumn: op.range.startColumn,
              endLineNumber: op.range.endLineNumber,
              endColumn: op.range.endColumn,
            },
            text: op.text,
          });
          model.pushEditOperations([], ops, () => []);
        }
        skipUpdateRef.current = false;
      });

      // Handle incoming cursor updates from the server
      socket().on(
        UserServiceMsg.RECEIVE_CURSOR,
        (name: string, cursor: Cursor) => {
          if (!editor || !monaco) return;

          // Clean up previous decoration for this user
          if (cursorDecorationsRef.current[name]) {
            cursorDecorationsRef.current[name].clear();
          }

          // Generate a consistent color for each user based on their name
          const color = COLORS[hashString(name) % COLORS.length];

          // Create cursor widget with label
          const cursorDecoration = editor.createDecorationsCollection([
            {
              range: new monaco.Range(
                cursor.line,
                cursor.column,
                cursor.line,
                cursor.column,
              ),
              options: {
                className: `cursor-widget-${name}`,
                beforeContentClassName: `cursor-widget`,
                // description: `${name}'s cursor`,
                isWholeLine: false,
                stickiness:
                  monaco.editor.TrackedRangeStickiness
                    .NeverGrowsWhenTypingAtEdges,
                // Use inline class name with specific background color
                inlineClassName: `cursor-widget-${name}`,
                hoverMessage: { value: `${name}'s cursor` },
              },
            },
          ]);

          // Add dynamic styles for this specific user's cursor
          const styleId = `cursor-style-${name}`;
          let styleElement = document.getElementById(styleId);
          if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
          }
          styleElement.textContent = `
          .cursor-widget-${name} {
            background-color: ${color} !important;
            width: 2px !important;
          }
          .cursor-widget-${name}::after {
            content: "${name}";
            background-color: ${color};
            position: absolute;
            top: -18px;
            left: 4px;
            font-size: 12px;
            padding: 0 4px;
            border-radius: 3px;
            white-space: nowrap;
            color: white;
            z-index: 100;
            animation: cursorFadeOut 0.2s ease-in forwards;
            animation-delay: 2.7s;
          }
        `;

          // Store the decoration reference
          cursorDecorationsRef.current[name] = cursorDecoration;

          // Remove cursor and styles after inactivity
          setTimeout(() => {
            if (cursorDecorationsRef.current[name] === cursorDecoration) {
              cursorDecoration.clear();
              delete cursorDecorationsRef.current[name];
              styleElement?.remove();
            }
          }, 3000);
        },
      );

      return () => {
        socket().off(CodeServiceMsg.RECEIVE_EDIT);
        socket().off(UserServiceMsg.RECEIVE_CURSOR);
      };
    },
    [editorRef, monacoRef, defaultCode],
  );

  function handleOnChange(
    value: string | undefined,
    ev: monaco.editor.IModelContentChangedEvent,
  ) {
    if (skipUpdateRef.current) return;

    ev.changes.forEach((change) => {
      const operation = change;
      if (operation) {
        socket().emit(
          CodeServiceMsg.SEND_EDIT,
          sessionStorage.getItem("roomId"),
          operation,
        );
      }
    });
  }

  // Generate a consistent color for each user
  function generateUserColor(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  return (
    <>
      <div className="h-[calc(100%-24px)] animate-fade-in">
        <Editor
          defaultLanguage="javascript"
          theme={theme}
          loading={
            <Alert className="max-w-md">
              <LoaderCircle className="size-5 animate-spin" />
              <AlertTitle>Setting up editor</AlertTitle>
              <AlertDescription>
                Setting up the editor for you. Please wait...
              </AlertDescription>
            </Alert>
          }
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={handleOnChange}
        />
      </div>
      {monacoInternalRef && editorInternalRef && (
        <section className="absolute bottom-0 h-6 w-full animate-fade-in bg-[#2678ca] py-1">
          <div className="flex justify-end text-xs text-neutral-100">
            <div className="px-2">
              {`Ln ${line}, Col ${column} ${
                selected ? `(${selected} selected)` : ""
              }`}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

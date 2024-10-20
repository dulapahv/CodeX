import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { LoaderCircle } from "lucide-react";
import * as monaco from "monaco-editor";
import themeList from "monaco-themes/themes/themelist.json";
import { useTheme } from "next-themes";

import type { Monaco } from "@monaco-editor/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { socket } from "@/lib/socket";

import { CodeServiceMsg } from "../../../../common/types/message";
import { ChangeOp } from "../../../../common/types/ot";

interface MonacoProps {
  monacoRef: (monaco: Monaco) => void;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  defaultCode?: string;
}

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
      socket().on(CodeServiceMsg.RECEIVE_EDIT, (op: ChangeOp, updatedCode) => {
        // Skip updating the editor if the change was made by the current user
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
    },
    [editorRef, monacoRef, defaultCode],
  );

  function handleOnChange(
    value: string | undefined,
    ev: monaco.editor.IModelContentChangedEvent,
  ) {
    // Skip updating the server if the change was made by the current user
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

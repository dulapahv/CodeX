"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Pencil } from "lucide-react";
import * as monaco from "monaco-editor";
import themeList from "monaco-themes/themes/themelist.json";
import { useTheme } from "next-themes";

import type { Monaco } from "@monaco-editor/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { socket } from "@/lib/socket";

import {
  applyOperation,
  DeleteOp,
  InsertOp,
  isDelete,
  isInsert,
  Tdd,
  Tdi,
  Tid,
  Tii,
} from "../../../../common/transform/ot";
import { CodeServiceMsg } from "../../../../common/types/message";
import {
  ChangeOp,
  OperationType,
  TextOperation,
} from "../../../../common/types/ot";

interface MonacoProps {
  monacoRef: (monaco: Monaco) => void;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  defaultCode?: string;
}

export function Monaco({ monacoRef, editorRef, defaultCode }: MonacoProps) {
  const { resolvedTheme } = useTheme();

  const [line, setLine] = useState(1);
  const [column, setColumn] = useState(1);
  const [selected, setSelected] = useState(0);

  const EditorInternalRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const MonacoInternalRef = useRef<Monaco | null>(null);
  const skipUpdateRef = useRef(false); // Use a ref to track if updates should be skipped

  function handleEditorWillMount(monaco: Monaco) {}

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef(editor);
      monacoRef(monaco);

      EditorInternalRef.current = editor;
      MonacoInternalRef.current = monaco;

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

      // Handle selected text
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

      // Register themes
      Object.entries(themeList).forEach(([key, value]) => {
        const json = require(`monaco-themes/themes/${value}.json`);
        monaco.editor.defineTheme(key, json);
      });

      // Handle incoming changes from the server
      socket().on(CodeServiceMsg.RECEIVE_EDIT, (op: ChangeOp, updatedCode) => {
        // Prevent triggering `handleOnChange` when applying received updates
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

      // Add window resize event listener
      window.addEventListener("resize", handleResize);
    },
    [editorRef, monacoRef],
  );

  // Function to handle window resize
  const handleResize = () => {
    if (EditorInternalRef.current) {
      EditorInternalRef.current.layout();
    }
  };

  // Cleanup function to remove event listener
  useEffect(() => {
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function handleOnChange(
    value: string | undefined,
    ev: monaco.editor.IModelContentChangedEvent,
  ) {
    if (skipUpdateRef.current) return; // Skip sending if it's a remote change

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
    <div className="flex h-full animate-fade-in flex-col">
      <Editor
        defaultLanguage="javascript"
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        loading={
          <Alert className="max-w-md">
            <Pencil className="size-4" />
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
      <section className="w-full bg-[#2678ca] py-1">
        <div className="flex justify-end text-xs text-neutral-100">
          <div className="px-2">
            {`Ln ${line}, Col ${column} ${
              selected ? `(${selected} selected)` : ""
            }`}
          </div>
        </div>
      </section>
    </div>
  );
}

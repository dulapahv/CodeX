"use client";

import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Pencil } from "lucide-react";
import * as monaco from "monaco-editor";
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
import { OperationType, TextOperation } from "../../../../common/types/ot";

interface MonacoProps {
  defaultCode?: string;
}

export function Monaco({ defaultCode }: MonacoProps) {
  const { resolvedTheme } = useTheme();

  const [line, setLine] = useState(1);
  const [column, setColumn] = useState(1);
  const [selected, setSelected] = useState(0);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const skipUpdateRef = useRef(false); // Use a ref to track if updates should be skipped

  function handleEditorWillMount(monaco: Monaco) {}

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) {
    editorRef.current = editor;

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

    // Handle incoming changes from the server
    socket().on(CodeServiceMsg.RECEIVE_EDIT, (operation, updatedCode) => {
      if (operation) {
        // Prevent triggering `handleOnChange` when applying received updates
        skipUpdateRef.current = true;
        const model = editor.getModel();
        if (model) {
          // const currentCode = model.getValue();
          // const updatedCode = applyOperation(currentCode, operation);
          // editor.setValue(updatedCode);

          const ops: monaco.editor.IIdentifiedSingleEditOperation[] = [];
          if (isInsert(operation)) {
            ops.push({
              forceMoveMarkers: true,
              range: {
                startLineNumber: 1,
                startColumn: operation.pos + 1,
                endLineNumber: 1,
                endColumn: operation.pos + 1,
              },
              text: operation.text,
            });
          } else if (isDelete(operation)) {
            ops.push({
              forceMoveMarkers: true,
              range: {
                startLineNumber: 1,
                startColumn: operation.pos + 1,
                endLineNumber: 1,
                endColumn: operation.pos + 1 + operation.length,
              },
              text: "",
            });
          }
          model.pushEditOperations([], ops, () => []);
        }
        skipUpdateRef.current = false;
      } else {
        // Sync the entire document if necessary
        skipUpdateRef.current = true;
        editor.setValue(updatedCode);
        skipUpdateRef.current = false;
      }
    });
  }

  /**
   * Converts Monaco Editor change event into a corresponding OT operation.
   * @param change The change object from Monaco Editor.
   * @returns An OT operation object.
   */
  function monacoChangeToOperation(change: any): TextOperation {
    const { range, text, rangeOffset, rangeLength } = change;

    if (rangeLength === 0) {
      // This is an Insert operation
      return {
        type: OperationType.Insert,
        pos: rangeOffset, // Position in terms of the document index
        text, // The text to insert
      };
    } else if (text === "") {
      // This is a Delete operation
      return {
        type: OperationType.Delete,
        pos: rangeOffset, // Position in terms of the document index
        length: rangeLength, // Number of characters to delete
      };
    }

    // Handle any other case as necessary
    return null as any;
  }

  function handleOnChange(
    value: string | undefined,
    ev: monaco.editor.IModelContentChangedEvent,
  ) {
    if (skipUpdateRef.current) return; // Skip sending if it's a remote change

    ev.changes.forEach((change) => {
      const operation = monacoChangeToOperation(change);
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
    <div className="flex h-full flex-col">
      <Editor
        defaultLanguage="javascript"
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        loading={
          <Alert className="max-w-md">
            <Pencil className="size-4" />
            <AlertTitle>Loading Editor</AlertTitle>
            <AlertDescription>
              Setting up the editor. Please wait...
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

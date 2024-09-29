"use client";

import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Braces } from "lucide-react";
import * as monaco from "monaco-editor";
import { useTheme } from "next-themes";

import type { Monaco } from "@monaco-editor/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function Monaco() {
  const { resolvedTheme } = useTheme();

  const [line, setLine] = useState(1);
  const [column, setColumn] = useState(1);
  const [selected, setSelected] = useState(0);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  function handleEditorWillMount(monaco: Monaco) {
    // monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    //   noSemanticValidation: true,
    //   noSyntaxValidation: true,
    // });
  }

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) {
    editorRef.current = editor;

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
  }

  function handleOnChange(
    value: string | undefined,
    ev: monaco.editor.IModelContentChangedEvent,
  ) {
    const editor = editorRef.current;
    if (!editor) return;
  }

  return (
    <div className="flex h-full flex-col">
      <Editor
        defaultLanguage="javascript"
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        loading={
          <Alert className="max-w-md">
            <Braces className="size-4" />
            <AlertTitle>Loading Editor</AlertTitle>
            <AlertDescription>
              Setting up the editor, please wait...
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
            {`Ln ${line}, Col ${column} ${selected ? `(${selected} selected)` : ""}`}
          </div>
        </div>
      </section>
    </div>
  );
}

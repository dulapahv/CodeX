import type * as monaco from "monaco-editor";

import type { Monaco } from "@monaco-editor/react";

export interface CursorPosition {
  line: number;
  column: number;
  selected: number;
}

export interface MonacoEditorProps {
  monacoRef: (monaco: Monaco) => void;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  defaultCode?: string;
}

export interface CursorDecorations {
  [key: string]: monaco.editor.IEditorDecorationsCollection;
}

export interface CleanupTimeouts {
  [key: string]: NodeJS.Timeout;
}

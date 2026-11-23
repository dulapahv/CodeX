/**
 * Live readings from the code editor for the editor tab, panel and status
 * bar, each re-rendering only what shows it.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import { useEffect, useState } from "react";

import type { FileModels } from "@/components/code-editor/service/file-models";

type Editor = monacoEditor.editor.IStandaloneCodeEditor;

// Monaco's MarkerSeverity values, which stay the same between versions
export const MARKER_SEVERITY = { error: 8, hint: 1, warning: 4 } as const;

export interface CursorPosition {
  column: number;
  line: number;
  selected: number;
}

export const useCursorPosition = (editor: Editor | null) => {
  const [position, setPosition] = useState<CursorPosition>({
    column: 1,
    line: 1,
    selected: 0,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    const update = (selection: monacoEditor.Selection | null) => {
      if (selection) {
        setPosition({
          column: selection.positionColumn,
          line: selection.positionLineNumber,
          selected: editor.getModel()?.getValueLengthInRange(selection) ?? 0,
        });
      }
    };
    const selectionChange = editor.onDidChangeCursorSelection(({ selection }) =>
      update(selection)
    );
    // Opening another file puts the cursor back where it was in that file
    const modelChange = editor.onDidChangeModel(() =>
      update(editor.getSelection())
    );
    return () => {
      selectionChange.dispose();
      modelChange.dispose();
    };
  }, [editor]);

  return position;
};

export interface Indentation {
  insertSpaces: boolean;
  tabSize: number;
}

export const useIndentation = (editor: Editor | null) => {
  const [indentation, setIndentation] = useState<Indentation | null>(null);

  useEffect(() => {
    if (!editor) {
      return;
    }
    let optionsChange: monacoEditor.IDisposable | undefined;
    const watchModel = () => {
      optionsChange?.dispose();
      const model = editor.getModel();
      const update = () => {
        const options = model?.getOptions();
        setIndentation(
          options
            ? { insertSpaces: options.insertSpaces, tabSize: options.tabSize }
            : null
        );
      };
      update();
      optionsChange = model?.onDidChangeOptions(update);
    };
    watchModel();
    const modelChange = editor.onDidChangeModel(watchModel);
    return () => {
      optionsChange?.dispose();
      modelChange.dispose();
    };
  }, [editor]);

  return indentation;
};

export interface Problem {
  fileId: string;
  marker: monacoEditor.editor.IMarker;
}

// Every file's errors and warnings, worst first
export const useProblems = (
  fileModels: FileModels | null,
  monaco: Monaco | null
) => {
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    if (!(fileModels && monaco)) {
      return;
    }
    const update = () => {
      const next: Problem[] = [];
      for (const marker of monaco.editor.getModelMarkers({})) {
        const model = monaco.editor.getModel(marker.resource);
        const fileId = model ? fileModels.getFileId(model) : null;
        if (fileId && marker.severity !== MARKER_SEVERITY.hint) {
          next.push({ fileId, marker });
        }
      }
      next.sort(
        (a, b) =>
          b.marker.severity - a.marker.severity ||
          a.marker.startLineNumber - b.marker.startLineNumber ||
          a.marker.startColumn - b.marker.startColumn
      );
      setProblems(next);
    };
    update();
    const markersChange = monaco.editor.onDidChangeMarkers(update);
    return () => markersChange.dispose();
  }, [fileModels, monaco]);

  return fileModels ? problems : [];
};

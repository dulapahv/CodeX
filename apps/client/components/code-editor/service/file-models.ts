/**
 * One Monaco model per room file, each kept in step with its shared text,
 * and which of them the editor shows.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import type * as Y from "yjs";

import {
  getFileText,
  observeFileList,
  type RoomFile,
  readFiles,
} from "@/lib/realtime/room-files";

import {
  bindModelToYText,
  COLLABORATIVE_REDO_ACTION_ID,
  COLLABORATIVE_UNDO_ACTION_ID,
  createUndoManager,
} from "./monaco-binding";

type Editor = monaco.editor.IStandaloneCodeEditor;
type Model = monaco.editor.ITextModel;

const LINE_BREAKS = /\r\n?/gu;

interface FileModel {
  model: Model;
  name: string;
  unbind: () => void;
}

export interface FileModels {
  dispose: () => void;
  getFileId: (model: Model) => string | null;
  getModel: (id: string) => Model | null;
  /** Called just before the editor changes file, while the old one shows */
  onWillShow: (listener: () => void) => () => void;
  /** Replaces a file's text as an edit this person can undo */
  replaceText: (id: string, text: string) => void;
  /** Shows a file, or none, each opening where it was left */
  show: (id: string | null) => void;
}

export const createFileModels = (
  doc: Y.Doc,
  editor: Editor,
  monacoInstance: Monaco
): FileModels => {
  const models = new Map<string, FileModel>();
  const undoManagers = new Map<string, Y.UndoManager>();
  const viewStates = new Map<string, monaco.editor.ICodeEditorViewState>();
  const willShowListeners = new Set<() => void>();
  const placeholder = editor.getModel();
  let shownId: string | null = null;
  // The room can close the editor before it tidies up its files
  let isEditorDisposed = false;
  const editorDispose = editor.onDidDispose(() => {
    isEditorDisposed = true;
  });

  // Named after the file so TypeScript can follow imports between files,
  // unless a rename briefly leaves two files with the same name
  const toUri = (file: RoomFile) => {
    const uri = monacoInstance.Uri.file(`/${file.name}`);
    return monacoInstance.editor.getModel(uri)
      ? monacoInstance.Uri.file(`/${file.id}/${file.name}`)
      : uri;
  };

  const createModel = (file: RoomFile, text: Y.Text) => {
    const model = monacoInstance.editor.createModel(
      text.toString(),
      file.language,
      toUri(file)
    );
    const unbind = bindModelToYText(text, model, monacoInstance);
    if (!undoManagers.has(file.id)) {
      undoManagers.set(file.id, createUndoManager(text));
    }
    const entry = { model, name: file.name, unbind };
    models.set(file.id, entry);
    return entry;
  };

  const disposeModel = ({ model, unbind }: FileModel) => {
    unbind();
    model.dispose();
  };

  const setEditorModel = (model: Model | null) => {
    for (const listener of willShowListeners) {
      listener();
    }
    editor.setModel(model);
  };

  const show = (id: string | null) => {
    const entry = id ? models.get(id) : undefined;
    if (id === shownId && editor.getModel() === (entry?.model ?? null)) {
      return;
    }
    const current = editor.getModel();
    if (shownId && current && current === models.get(shownId)?.model) {
      const viewState = editor.saveViewState();
      if (viewState) {
        viewStates.set(shownId, viewState);
      }
    }
    shownId = id;
    setEditorModel(entry?.model ?? null);
    const viewState = id ? viewStates.get(id) : undefined;
    if (viewState) {
      editor.restoreViewState(viewState);
    }
    if (placeholder && !placeholder.isDisposed() && entry) {
      placeholder.dispose();
    }
  };

  const removeFile = (id: string) => {
    const entry = models.get(id);
    if (entry) {
      if (editor.getModel() === entry.model) {
        setEditorModel(null);
      }
      disposeModel(entry);
      models.delete(id);
    }
    undoManagers.get(id)?.destroy();
    undoManagers.delete(id);
    viewStates.delete(id);
  };

  // A model's address can't change, so a renamed file gets a new model
  const renameModel = (file: RoomFile, text: Y.Text, old: FileModel) => {
    const isShown = editor.getModel() === old.model;
    const viewState = isShown ? editor.saveViewState() : null;
    old.unbind();
    old.model.dispose();
    models.delete(file.id);
    const { model } = createModel(file, text);
    if (isShown) {
      setEditorModel(model);
      if (viewState) {
        editor.restoreViewState(viewState);
      }
    }
  };

  const syncFile = (file: RoomFile) => {
    const text = getFileText(doc, file.id);
    const entry = models.get(file.id);
    if (!text) {
      return;
    }
    if (!entry) {
      const { model } = createModel(file, text);
      if (shownId === file.id) {
        setEditorModel(model);
      }
    } else if (entry.name !== file.name) {
      renameModel(file, text, entry);
    } else if (entry.model.getLanguageId() !== file.language) {
      monacoInstance.editor.setModelLanguage(entry.model, file.language);
    }
  };

  const sync = () => {
    const files = readFiles(doc);
    const ids = new Set(files.map(({ id }) => id));
    for (const id of [...models.keys()]) {
      if (!ids.has(id)) {
        removeFile(id);
      }
    }
    for (const file of files) {
      syncFile(file);
    }
  };

  sync();
  const stopObserving = observeFileList(doc, sync);

  const runOnShown = (action: (manager: Y.UndoManager) => void) => () => {
    const manager = shownId ? undoManagers.get(shownId) : undefined;
    if (manager) {
      action(manager);
    }
  };

  const undoAction = editor.addAction({
    id: COLLABORATIVE_UNDO_ACTION_ID,
    keybindings: [
      // biome-ignore lint/suspicious/noBitwiseOperators: Monaco keybindings are bit flags
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyZ,
    ],
    label: "Undo",
    run: runOnShown((manager) => manager.undo()),
  });

  const redoAction = editor.addAction({
    id: COLLABORATIVE_REDO_ACTION_ID,
    keybindings: [
      // biome-ignore lint/suspicious/noBitwiseOperators: Monaco keybindings are bit flags
      monacoInstance.KeyMod.CtrlCmd |
        monacoInstance.KeyMod.Shift |
        monacoInstance.KeyCode.KeyZ,
      // biome-ignore lint/suspicious/noBitwiseOperators: Monaco keybindings are bit flags
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyY,
    ],
    label: "Redo",
    run: runOnShown((manager) => manager.redo()),
  });

  return {
    dispose: () => {
      stopObserving();
      editorDispose.dispose();
      undoAction.dispose();
      redoAction.dispose();
      if (!isEditorDisposed) {
        editor.setModel(null);
      }
      for (const entry of models.values()) {
        disposeModel(entry);
      }
      for (const manager of undoManagers.values()) {
        manager.destroy();
      }
      models.clear();
      undoManagers.clear();
    },
    getFileId: (model) => {
      for (const [id, entry] of models) {
        if (entry.model === model) {
          return id;
        }
      }
      return null;
    },
    getModel: (id) => models.get(id)?.model ?? null,
    onWillShow: (listener) => {
      willShowListeners.add(listener);
      return () => {
        willShowListeners.delete(listener);
      };
    },
    replaceText: (id, text) => {
      const model = models.get(id)?.model;
      model?.applyEdits([
        {
          range: model.getFullModelRange(),
          text: text.replace(LINE_BREAKS, "\n"),
        },
      ]);
    },
    show,
  };
};

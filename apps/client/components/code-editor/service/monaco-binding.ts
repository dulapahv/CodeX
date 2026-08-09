/**
 * Two-way binding between a Yjs text type and a Monaco editor model.
 * Features:
 * - Applies remote CRDT deltas to the model
 * - Converts model changes into CRDT operations
 * - Keeps model offsets aligned with the document
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import * as Y from "yjs";

import { LOCAL_ORIGIN } from "./yjs-origins";

const noop = (): void => {
  // Nothing was bound, so there is nothing to tear down.
};

/** How long consecutive local edits merge into one undo step. */
const UNDO_CAPTURE_TIMEOUT_MS = 500;

/**
 * Bind a Y.Text to the editor's model.
 *
 * @param ytext Shared text type backing the document
 * @param editor Monaco editor instance
 * @param monacoInstance The Monaco namespace handed to `onMount`
 * @returns A function that detaches every listener this call registered
 *
 * @remarks
 * `monacoInstance` is passed in rather than imported. `@monaco-editor/react`
 * loads Monaco from a CDN at runtime, so importing `monaco-editor` here would
 * pull a second, different-versioned copy into the bundle.
 */
export const bindMonacoToYText = (
  ytext: Y.Text,
  editor: monaco.editor.IStandaloneCodeEditor,
  monacoInstance: Monaco
): (() => void) => {
  const model = editor.getModel();
  const doc = ytext.doc;
  if (!(model && doc)) {
    return noop;
  }

  // True while remote changes are being written into the model, so the model
  // listener knows not to send them straight back out again.
  let isApplyingRemote = false;

  const withRemoteGuard = (apply: () => void): void => {
    isApplyingRemote = true;
    try {
      apply();
    } finally {
      isApplyingRemote = false;
    }
  };

  // Seed the model with whatever the document already holds. Monaco infers
  // EOL from the text it is given, so re-assert LF: Y.Text stores "\n" only,
  // and a CRLF model would offset every subsequent position by one per line.
  withRemoteGuard(() => {
    model.setValue(ytext.toString());
    model.setEOL(monacoInstance.editor.EndOfLineSequence.LF);
  });

  // Document -> model. Changes tagged LOCAL_ORIGIN came from the model and
  // are already there. Everything else - remote peers, and undo/redo - has to
  // be written in.
  const observer = (event: Y.YTextEvent, transaction: Y.Transaction): void => {
    if (transaction.origin === LOCAL_ORIGIN) {
      return;
    }

    withRemoteGuard(() => {
      let offset = 0;
      for (const delta of event.delta) {
        if (delta.retain !== undefined) {
          offset += delta.retain;
        } else if (typeof delta.insert === "string") {
          const position = model.getPositionAt(offset);
          model.applyEdits([
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
              text: delta.insert,
            },
          ]);
          offset += delta.insert.length;
        } else if (delta.delete !== undefined) {
          const start = model.getPositionAt(offset);
          const end = model.getPositionAt(offset + delta.delete);
          model.applyEdits([
            {
              range: {
                startLineNumber: start.lineNumber,
                startColumn: start.column,
                endLineNumber: end.lineNumber,
                endColumn: end.column,
              },
              text: "",
            },
          ]);
        }
      }
    });
  };
  ytext.observe(observer);

  // Model -> document. Monaco reports offsets against the pre-change text, so
  // apply the changes highest-offset-first to keep the lower ones valid.
  const contentDisposable = model.onDidChangeContent((event) => {
    if (isApplyingRemote) {
      return;
    }

    const changes = [...event.changes].sort(
      (a, b) => b.rangeOffset - a.rangeOffset
    );

    doc.transact(() => {
      for (const change of changes) {
        if (change.rangeLength > 0) {
          ytext.delete(change.rangeOffset, change.rangeLength);
        }
        if (change.text) {
          ytext.insert(change.rangeOffset, change.text);
        }
      }
    }, LOCAL_ORIGIN);
  });

  // Undo is driven from the document, not the model. Monaco's undo entries
  // store the range an edit occupied when it was made, so a peer inserting
  // ahead of that text leaves the entry pointing at the wrong characters.
  // The CRDT tracks the actual operations, and restricting it to
  // LOCAL_ORIGIN means this client can never undo a peer's edit.
  const undoManager = new Y.UndoManager(ytext, {
    captureTimeout: UNDO_CAPTURE_TIMEOUT_MS,
    trackedOrigins: new Set([LOCAL_ORIGIN]),
  });

  // Monaco encodes a chord as a bitwise OR of its modifier and key constants;
  // there is no non-bitwise form of this API.
  const undoAction = editor.addAction({
    id: "codex.collaborative-undo",
    label: "Undo",
    keybindings: [
      // biome-ignore lint/suspicious/noBitwiseOperators: Monaco keybindings are bit flags
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyZ,
    ],
    run: () => {
      undoManager.undo();
    },
  });

  const redoAction = editor.addAction({
    id: "codex.collaborative-redo",
    label: "Redo",
    keybindings: [
      // biome-ignore lint/suspicious/noBitwiseOperators: Monaco keybindings are bit flags
      monacoInstance.KeyMod.CtrlCmd |
        monacoInstance.KeyMod.Shift |
        monacoInstance.KeyCode.KeyZ,
      // biome-ignore lint/suspicious/noBitwiseOperators: Monaco keybindings are bit flags
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyY,
    ],
    run: () => {
      undoManager.redo();
    },
  });

  return () => {
    undoAction.dispose();
    redoAction.dispose();
    undoManager.destroy();
    contentDisposable.dispose();
    ytext.unobserve(observer);
  };
};

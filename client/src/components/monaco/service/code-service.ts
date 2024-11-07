/**
 * This file is responsible for updating the code in the editor.
 *
 * This file contains 1 function:
 * 1. updateCode
 *    - Update the code in the editor.
 *
 * Created by Dulapah Vibulsanti (https://github.com/dulapahv).
 */

import * as monaco from "monaco-editor";

import { EditOp } from "../../../../../common/types/operation";

/**
 * Update the code in the editor.
 * @param op Edit operation.
 * @param editorInstanceRef Editor instance reference.
 * @param skipUpdateRef Skip update reference.
 */
export const updateCode = (
  op: EditOp,
  editorInstanceRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>,
  skipUpdateRef: React.MutableRefObject<boolean>,
): void => {
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
          range: {
            startLineNumber: op.r.sL,
            startColumn: op.r.sC,
            endLineNumber: op.r.eL,
            endColumn: op.r.eC,
          },
          text: op.t,
        },
      ],
      () => [],
    );
  }
  skipUpdateRef.current = false;
};

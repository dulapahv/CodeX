export interface EditOp {
  t: string; // text
  r: {
    // range
    sL: number; // startLineNumber
    sC: number; // startColumn
    eL: number; // endLineNumber
    eC: number; // endColumn
  };
}

export interface Cursor {
  pL: number; // positionLineNumber
  pC: number; // positionColumn
  sL?: number; // startLineNumber
  sC?: number; // startColumn
  eL?: number; // endLineNumber
  eC?: number; // endColumn
}

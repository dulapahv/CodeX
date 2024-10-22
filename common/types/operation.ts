export interface EditOp {
  text: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

export interface Cursor {
  line: number;
  column: number;
}

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
  positionLineNumber: number;
  positionColumn: number;
  startLineNumber?: number;
  startColumn?: number;
  endLineNumber?: number;
  endColumn?: number;
}

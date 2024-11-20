export interface ExecutionResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  timestamp?: Date;
  executionTime?: number;
  type?: ExecutionResultType;
}

export enum ExecutionResultType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  OUTPUT = 'output',
}

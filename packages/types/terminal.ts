/**
 * Types for code execution results and terminal output.
 * Includes:
 * - Execution result interface
 * - Result type enumeration
 * - Output metadata
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

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

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
  executionTime?: number;
  language: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  timestamp?: Date;
  type?: ExecutionResultType;
  version: string;
}

export enum ExecutionResultType {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  OUTPUT = "output",
}

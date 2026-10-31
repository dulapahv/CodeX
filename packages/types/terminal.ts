/**
 * Types for code execution results and terminal output.
 * Includes:
 * - Execution result interface
 * - Result type enumeration
 * - Output metadata
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

/**
 * Why Piston stopped a stage. RE is a runtime error, SG a fatal signal, TO a
 * timeout, OL and EL stdout and stderr past the length limit, XX an internal
 * error.
 */
export type ExecutionStatus = "RE" | "SG" | "TO" | "OL" | "EL" | "XX";

/** Times are in milliseconds and memory in bytes */
export interface ExecutionStage {
  code: number | null;
  cpu_time?: number | null;
  memory?: number | null;
  message?: string | null;
  output: string;
  signal: string | null;
  status?: ExecutionStatus | null;
  stderr: string;
  stdout: string;
  wall_time?: number | null;
}

export interface ExecutionResult {
  /** Only for compiled languages. When it fails, run is a copy of it */
  compile?: ExecutionStage;
  language: string;
  run: ExecutionStage;
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

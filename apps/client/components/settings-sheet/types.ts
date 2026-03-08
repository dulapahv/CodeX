/**
 * Type definitions for editor option configurations.
 * Features:
 * - Option metadata
 * - Type constraints
 * - Value definitions
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export interface EditorOption {
  currentValue: unknown;
  options?: string[];
  title: string;
  type: "boolean" | "string" | "number" | "select" | "text";
}

/**
 * Type definitions for editor option configurations.
 * Features:
 * - Option metadata
 * - Type constraints
 * - Value definitions
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export type EditorOption = {
  title: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'text';
  options?: string[];
  currentValue: unknown;
};

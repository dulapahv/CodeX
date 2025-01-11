/**
 * Type definitions for editor operations.
 * Includes:
 * - Edit operation type
 * - Cursor position type
 * - Range information
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

/**
 * Edit operation for the editor.
 * Contains text and range data.
 *
 * Index 0: text
 * Index 1: startLineNumber
 * Index 2: startColumn
 * Index 3: endLineNumber
 * Index 4: endColumn
 */

export type EditOp = [string, number, number, number, number];

/**
 * Cursor data for the editor.
 * Each element represents a user's cursor.
 *
 * Index 0: positionLineNumber
 * Index 1: positionColumn
 * Index 2: startLineNumber
 * Index 3: startColumn
 * Index 4: endLineNumber
 * Index 5: endColumn
 */
export type Cursor = [number, number, number?, number?, number?, number?];

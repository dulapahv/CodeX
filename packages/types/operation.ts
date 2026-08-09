/**
 * Type definitions for editor operations.
 * Includes:
 * - Binary CRDT payload type
 * - Cursor position type
 * - Range information
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

/**
 * A binary Yjs payload as it travels over Socket.IO, either a document
 * update or an encoded state vector.
 *
 * The union is not cosmetic: Socket.IO delivers binary as a `Buffer` on the
 * server and as an `ArrayBuffer` in the browser, so both ends must normalise
 * with their local `toUint8Array` helper before handing bytes to Yjs.
 */
export type YjsUpdate = ArrayBuffer | Uint8Array;

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

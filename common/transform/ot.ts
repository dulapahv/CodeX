/**
 * This file contains the implementation of the
 * Operational Transformation (OT) algorithm.
 *
 * Implements insert and delete operations.
 * Able to handle concurrent operations.
 */

// Define the types of operations: Insert and Delete
enum OperationType {
  Insert = 'Insert',
  Delete = 'Delete',
  Identity = 'Identity',
}

// Define the interface for Insert operation (multi-character support)
export interface InsertOp {
  type: OperationType.Insert;
  pos: number;
  text: string; // Supports multi-character insertions
}

// Define the interface for Delete operation (multi-character support)
export interface DeleteOp {
  type: OperationType.Delete;
  pos: number;
  length: number; // Supports deleting multiple characters
}

// Define a type that can be either Insert or Delete
export type TextOperation = InsertOp | DeleteOp;

// Identity operation (no changes)
const Id = { type: OperationType.Identity } as const;

// Utility function to check if an operation is an Insert
export function isInsert(op: TextOperation): op is InsertOp {
  return op.type === OperationType.Insert;
}

// Utility function to check if an operation is a Delete
export function isDelete(op: TextOperation): op is DeleteOp {
  return op.type === OperationType.Delete;
}

// Insert-Insert transformation
export function Tii(ins1: InsertOp, ins2: InsertOp): InsertOp {
  if (ins1.pos < ins2.pos || (ins1.pos === ins2.pos && order() === -1)) {
    return { ...ins1 }; // No position change
  } else {
    return { ...ins1, pos: ins1.pos + ins2.text.length }; // Shift position forward by the length of ins2
  }
}

// Insert-Delete transformation
export function Tid(ins: InsertOp, del: DeleteOp): InsertOp {
  if (ins.pos <= del.pos) {
    return { ...ins }; // No position change
  } else if (ins.pos > del.pos + del.length) {
    return { ...ins, pos: ins.pos - del.length }; // Shift position back if insertion is after the deleted range
  } else {
    return { ...ins, pos: del.pos }; // Insertion falls inside deleted range; snap to start of delete
  }
}

// Delete-Insert transformation
export function Tdi(del: DeleteOp, ins: InsertOp): DeleteOp {
  if (del.pos < ins.pos) {
    return { ...del }; // No position change
  } else if (del.pos >= ins.pos) {
    return { ...del, pos: del.pos + ins.text.length }; // Shift position forward by the length of the inserted text
  } else {
    return { ...del }; // No position change
  }
}

// Delete-Delete transformation
export function Tdd(del1: DeleteOp, del2: DeleteOp): DeleteOp | typeof Id {
  if (del1.pos < del2.pos) {
    return { ...del1 }; // No position change
  } else if (del1.pos >= del2.pos + del2.length) {
    return { ...del1, pos: del1.pos - del2.length }; // Shift position back if the delete is after the deleted range
  } else {
    return Id; // Identity operation when both deletes overlap
  }
}

/**
 * Dummy order function for tie-breaking between insertions.
 * Modify based on your use case (e.g., timestamp, user ID, etc.)
 */
function order(): number {
  return -1; // Use -1 for "ins1" precedes "ins2", and 1 otherwise.
}

/**
 * Applies an edit operation to the current document state.
 * @param currentCode The current code in the room.
 * @param operation The incoming operation to apply.
 * @returns The updated code after applying the operation.
 */
export function applyOperation(
  currentCode: string,
  operation: TextOperation
): string {
  switch (operation.type) {
    case OperationType.Insert:
      return (
        currentCode.slice(0, operation.pos) +
        operation.text + // Insert the entire text
        currentCode.slice(operation.pos)
      );
    case OperationType.Delete:
      return (
        currentCode.slice(0, operation.pos) +
        currentCode.slice(operation.pos + operation.length) // Remove specified range
      );
    default:
      return currentCode;
  }
}

const ins1: InsertOp = { type: OperationType.Insert, pos: 3, text: 'abc' };
const ins2: InsertOp = { type: OperationType.Insert, pos: 4, text: 'xyz' };
const del1: DeleteOp = { type: OperationType.Delete, pos: 3, length: 2 };
const del2: DeleteOp = { type: OperationType.Delete, pos: 1, length: 1 };

console.log(Tii(ins1, ins2)); // Insert shifts forward by length of ins2: { type: 'Insert', pos: 3, text: 'abc' }
console.log(Tid(ins1, del2)); // Insert shifts to the left: { type: 'Insert', pos: 2, text: 'abc' }
console.log(Tdi(del1, ins2)); // Delete shifts forward: { type: 'Delete', pos: 6, length: 2 }
console.log(Tdd(del1, del2)); // Delete shifts back: { type: 'Delete', pos: 2, length: 2 }

// Define the types of operations: Insert and Delete
export enum OperationType {
  Insert = 'Insert',
  Delete = 'Delete',
  Identity = 'Identity',
}

// Define the interface for Insert operation
export interface InsertOp {
  type: OperationType.Insert;
  pos: number;
  text: string; // Supports multi-character insertions
}

// Define the interface for Delete operation
export interface DeleteOp {
  type: OperationType.Delete;
  pos: number;
  length: number; // Supports deleting multiple characters
}

// Define a type that can be either Insert or Delete
export type TextOperation = InsertOp | DeleteOp;

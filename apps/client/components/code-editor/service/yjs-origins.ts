/**
 * Transaction origin markers for the collaborative document.
 * Features:
 * - Distinguishes editor-authored changes from everyone else's
 * - Scopes undo/redo to this client's own edits
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

/**
 * Marks a transaction produced by the local Monaco model. The binding skips
 * echoing these back into the model, and the undo manager tracks only these.
 */
export const LOCAL_ORIGIN = Symbol("codex:local");

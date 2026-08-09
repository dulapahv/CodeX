/**
 * Transaction origin markers for the collaborative document.
 * Features:
 * - Distinguishes editor-authored changes from networked ones
 * - Scopes undo/redo to this client's own edits
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

/**
 * Marks a transaction produced by the local Monaco model. The binding skips
 * echoing these back into the model, and the undo manager tracks only these.
 */
export const LOCAL_ORIGIN = Symbol("codex:local");

/**
 * Marks a transaction produced by applying bytes received from the server.
 * The transport skips re-emitting these, which is what stops update loops.
 */
export const REMOTE_ORIGIN = Symbol("codex:remote");

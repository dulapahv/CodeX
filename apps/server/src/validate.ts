/**
 * Checks for untrusted input reaching a room: custom messages and Yjs
 * awareness updates. Anything malformed is dropped rather than relayed.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ClientMessage } from "@codex/types/realtime";
import { MAX_NAME_LENGTH } from "@codex/types/realtime";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";

const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;
const MAX_PRESENCE_LENGTH = 4096;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isValidName = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= MAX_NAME_LENGTH &&
  !CONTROL_CHARACTER_PATTERN.test(value);

export const isClientId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export const parseClientMessage = (raw: string): ClientMessage | null => {
  let message: unknown;
  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(message)) {
    return null;
  }

  switch (message.type) {
    case "terminal":
      return isRecord(message.result) && isRecord(message.result.run)
        ? (message as ClientMessage)
        : null;
    case "terminate":
      return { type: "terminate" };
    case "lock":
      return typeof message.locked === "boolean"
        ? { locked: message.locked, type: "lock" }
        : null;
    case "make-host":
    case "remove":
      return isClientId(message.clientId)
        ? { clientId: message.clientId, type: message.type }
        : null;
    case "set-role":
      return isClientId(message.clientId) &&
        (message.role === "editor" || message.role === "viewer")
        ? { clientId: message.clientId, role: message.role, type: "set-role" }
        : null;
    default:
      return null;
  }
};

// A removed client (null) is always fine; a live one must carry a valid name
const isValidPresence = (state: unknown, json: string): boolean =>
  state === null ||
  (json.length <= MAX_PRESENCE_LENGTH &&
    isRecord(state) &&
    isRecord(state.user) &&
    isValidName(state.user.name));

export interface AwarenessEntry {
  clientID: number;
  clock: number;
  json: string;
}

const encodeAwarenessEntries = (entries: AwarenessEntry[]) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, entries.length);
  for (const { clientID, clock, json } of entries) {
    encoding.writeVarUint(encoder, clientID);
    encoding.writeVarUint(encoder, clock);
    encoding.writeVarString(encoder, json);
  }
  return encoding.toUint8Array(encoder);
};

// Tells everyone a client has gone, newer than its last presence
export const encodeAwarenessRemoval = (clientID: number, clock: number) =>
  encodeAwarenessEntries([{ clientID, clock, json: "null" }]);

/**
 * Re-encodes an awareness update with only the entries `isAllowed` accepts
 * and whose presence is valid. Returns null when nothing is left.
 */
export const filterAwarenessUpdate = (
  update: Uint8Array,
  isAllowed: (clientID: number) => boolean
): { entries: AwarenessEntry[]; update: Uint8Array } | null => {
  const kept: AwarenessEntry[] = [];
  try {
    const decoder = decoding.createDecoder(update);
    const count = decoding.readVarUint(decoder);
    for (let i = 0; i < count; i += 1) {
      const clientID = decoding.readVarUint(decoder);
      const clock = decoding.readVarUint(decoder);
      const json = decoding.readVarString(decoder);
      if (isAllowed(clientID) && isValidPresence(JSON.parse(json), json)) {
        kept.push({ clientID, clock, json });
      }
    }
  } catch {
    return null;
  }

  if (kept.length === 0) {
    return null;
  }
  return { entries: kept, update: encodeAwarenessEntries(kept) };
};

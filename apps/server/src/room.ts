/**
 * One Durable Object per room. Holds the room's Yjs document (code, language,
 * notes), relays presence, keeps recent terminal output, vouches for its
 * connections' use of the Realtime SFU proxy, and wipes itself once the room
 * has been empty for the grace period or someone terminates it.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  CloseCode,
  type ServerMessage,
  TERMINAL_HISTORY_LIMIT,
} from "@codex/types/realtime";
import type { ExecutionResult } from "@codex/types/terminal";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import type { Connection, ConnectionContext, WSMessage } from "partyserver";
import { YServer } from "y-partyserver";
import * as Y from "yjs";

import { filterAwarenessUpdate, parseClientMessage } from "./validate";

const CREATED_AT_KEY = "meta:createdAt";
const DOC_CHUNKS_KEY = "doc:chunks";
const DOC_CHUNK_PREFIX = "doc:";
// Durable Object storage caps each value at 2 MB
const DOC_CHUNK_SIZE = 1_000_000;
const TERMINAL_PREFIX = "terminal:";
const TERMINAL_SEQUENCE_KEY = "terminal-sequence";
const TERMINAL_KEY_DIGITS = 12;
const DEFAULT_GRACE_MS = 300_000;

const MESSAGE_AWARENESS = 1;
const MESSAGE_QUERY_AWARENESS = 3;
// y-partyserver records each connection's awareness client IDs under this
// key in the connection state, which survives hibernation
const AWARENESS_IDS_KEY = "__ypsAwarenessIds";
const MEDIA_TOKEN_KEY = "mediaToken";

type ConnectionState = Record<string, unknown> | null;

const stateOf = (connection: Connection) => connection.state as ConnectionState;

const awarenessIdsOf = (connection: Connection): number[] => {
  const ids = stateOf(connection)?.[AWARENESS_IDS_KEY];
  return Array.isArray(ids) ? ids : [];
};

const toBytes = (message: ArrayBuffer | ArrayBufferView): Uint8Array =>
  message instanceof ArrayBuffer
    ? new Uint8Array(message)
    : new Uint8Array(message.buffer, message.byteOffset, message.byteLength);

const terminalKey = (sequence: number) =>
  `${TERMINAL_PREFIX}${String(sequence).padStart(TERMINAL_KEY_DIGITS, "0")}`;

const serialize = (message: ServerMessage) => JSON.stringify(message);

export class Room extends YServer {
  static options = { hibernate: true };
  static callbackOptions = { debounceWait: 2000, debounceMaxWait: 10_000 };

  private get graceMs() {
    return Number(this.env.ROOM_GRACE_MS) || DEFAULT_GRACE_MS;
  }

  private get mediaEnabled() {
    return Boolean(this.env.SFU_APP_ID && this.env.SFU_APP_TOKEN);
  }

  // RPC from the Worker: claim this room ID, false if it is already taken
  async create(): Promise<boolean> {
    if (await this.exists()) {
      return false;
    }
    await this.ctx.storage.put(CREATED_AT_KEY, Date.now());
    // Wiped like an emptied room if nobody ever joins
    await this.ctx.storage.setAlarm(Date.now() + this.graceMs);
    return true;
  }

  // RPC from the Worker
  async exists(): Promise<boolean> {
    return (await this.ctx.storage.get(CREATED_AT_KEY)) !== undefined;
  }

  // RPC from the Worker's SFU proxy: true while an open connection holds it
  hasMediaToken(token: string): boolean {
    for (const connection of this.getConnections()) {
      if (stateOf(connection)?.[MEDIA_TOKEN_KEY] === token) {
        return true;
      }
    }
    return false;
  }

  async onLoad() {
    const count = await this.ctx.storage.get<number>(DOC_CHUNKS_KEY);
    if (!count) {
      return;
    }
    const keys = Array.from(
      { length: count },
      (_, index) => `${DOC_CHUNK_PREFIX}${index}`
    );
    const stored = await this.ctx.storage.get<Uint8Array>(keys);
    const chunks = keys.map((key) => stored.get(key) ?? new Uint8Array());
    const state = new Uint8Array(
      chunks.reduce((total, chunk) => total + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      state.set(chunk, offset);
      offset += chunk.length;
    }
    Y.applyUpdate(this.document, state);
  }

  async onSave() {
    // A debounced save can land after the room was wiped
    if (!(await this.exists())) {
      return;
    }
    const state = Y.encodeStateAsUpdate(this.document);
    const count = Math.max(1, Math.ceil(state.length / DOC_CHUNK_SIZE));
    const entries: Record<string, unknown> = { [DOC_CHUNKS_KEY]: count };
    for (let index = 0; index < count; index++) {
      entries[`${DOC_CHUNK_PREFIX}${index}`] = state.slice(
        index * DOC_CHUNK_SIZE,
        (index + 1) * DOC_CHUNK_SIZE
      );
    }

    const previous = (await this.ctx.storage.get<number>(DOC_CHUNKS_KEY)) ?? 0;
    await this.ctx.storage.put(entries);
    if (previous > count) {
      const stale = Array.from(
        { length: previous - count },
        (_, index) => `${DOC_CHUNK_PREFIX}${count + index}`
      );
      await this.ctx.storage.delete(stale);
    }
  }

  async onConnect(connection: Connection, ctx: ConnectionContext) {
    if (!(await this.exists())) {
      // onConnect runs before the upgrade response is sent, and a close
      // issued that early never reaches the client
      setTimeout(() => {
        connection.close(CloseCode.ROOM_NOT_FOUND, "Room not found");
      }, 0);
      return;
    }
    await this.ctx.storage.deleteAlarm();

    super.onConnect(connection, ctx);

    // Connection state is persisted with the WebSocket, so the token
    // survives hibernation. y-partyserver merges its own keys into it.
    const token = crypto.randomUUID();
    connection.setState((previous: ConnectionState) => ({
      ...previous,
      [MEDIA_TOKEN_KEY]: token,
    }));
    this.sendCustomMessage(
      connection,
      serialize({ type: "media", enabled: this.mediaEnabled, token })
    );

    this.sendCustomMessage(
      connection,
      serialize({
        type: "terminal-history",
        results: await this.readTerminalHistory(),
      })
    );

    // Awareness lives only in memory, so after hibernation the server knows
    // nobody's presence. Ask everyone else to send theirs again.
    const query = new Uint8Array([MESSAGE_QUERY_AWARENESS]);
    for (const other of this.getConnections()) {
      if (other.id !== connection.id) {
        other.send(query);
      }
    }
  }

  onMessage(connection: Connection, message: WSMessage) {
    if (typeof message === "string") {
      return super.onMessage(connection, message);
    }

    try {
      const decoder = decoding.createDecoder(toBytes(message));
      if (decoding.readVarUint(decoder) !== MESSAGE_AWARENESS) {
        return super.onMessage(connection, message);
      }

      // Only accept presence for client IDs no other connection owns, so a
      // client answering an awareness query can't claim someone else's state
      const update = filterAwarenessUpdate(
        decoding.readVarUint8Array(decoder),
        (clientID) => !this.isOwnedByOther(clientID, connection)
      );
      if (!update) {
        return;
      }
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(encoder, update);
      return super.onMessage(connection, encoding.toUint8Array(encoder));
    } catch {
      // Malformed binary message: drop it
    }
  }

  async onClose(
    connection: Connection,
    code: number,
    reason: string,
    wasClean: boolean
  ) {
    super.onClose(connection, code, reason, wasClean);

    const hasOthers = [...this.getConnections()].some(
      (other) => other.id !== connection.id
    );
    if (!hasOthers && (await this.exists())) {
      await this.onSave();
      await this.ctx.storage.setAlarm(Date.now() + this.graceMs);
    }
  }

  async onAlarm() {
    if ([...this.getConnections()].length > 0) {
      return;
    }
    await this.ctx.storage.deleteAll();
  }

  onCustomMessage(connection: Connection, raw: string) {
    const message = parseClientMessage(raw);
    if (!message) {
      return;
    }

    switch (message.type) {
      case "terminal":
        this.broadcastCustomMessage(serialize(message), connection);
        this.storeTerminalResult(message.result).catch((error: unknown) => {
          console.error("Failed to store terminal output:", error);
        });
        break;
      case "terminate":
        this.terminate().catch((error: unknown) => {
          console.error("Failed to terminate room:", error);
        });
        break;
      default:
        break;
    }
  }

  private isOwnedByOther(clientID: number, connection: Connection) {
    for (const other of this.getConnections()) {
      if (
        other.id !== connection.id &&
        awarenessIdsOf(other).includes(clientID)
      ) {
        return true;
      }
    }
    return false;
  }

  private async terminate() {
    this.broadcastCustomMessage(serialize({ type: "terminated" }));
    for (const connection of this.getConnections()) {
      connection.close(CloseCode.TERMINATED, "Room terminated");
    }
    await this.ctx.storage.deleteAll();
  }

  private async storeTerminalResult(result: ExecutionResult) {
    const sequence =
      ((await this.ctx.storage.get<number>(TERMINAL_SEQUENCE_KEY)) ?? 0) + 1;
    await this.ctx.storage.put({
      [TERMINAL_SEQUENCE_KEY]: sequence,
      [terminalKey(sequence)]: result,
    });
    const expired = sequence - TERMINAL_HISTORY_LIMIT;
    if (expired > 0) {
      await this.ctx.storage.delete(terminalKey(expired));
    }
  }

  private async readTerminalHistory(): Promise<ExecutionResult[]> {
    const entries = await this.ctx.storage.list<ExecutionResult>({
      prefix: TERMINAL_PREFIX,
    });
    return [...entries.values()];
  }
}

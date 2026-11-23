/**
 * One Durable Object per room. Holds the room's Yjs document (code, language,
 * notes), relays presence, keeps recent terminal output, vouches for its
 * connections' use of the Realtime SFU proxy, and wipes itself once the room
 * has been empty for the grace period or someone terminates it.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  BROWSER_ID_PARAM,
  CLIENT_ID_PARAM,
  CloseCode,
  HOST_KEY_PARAM,
  ROOM_TOKEN_PARAM,
  type RoomRole,
  type ServerMessage,
  TERMINAL_HISTORY_LIMIT,
} from "@codex/types/realtime";
import type { ExecutionResult } from "@codex/types/terminal";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import type { Connection, ConnectionContext, WSMessage } from "partyserver";
import { YServer } from "y-partyserver";
import * as Y from "yjs";

import {
  type AwarenessEntry,
  encodeAwarenessRemoval,
  filterAwarenessUpdate,
  parseClientMessage,
} from "./validate";

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
const CLIENT_ID_KEY = "clientId";
const ROLE_KEY = "role";
const ROOM_TOKEN_KEY = "roomToken";
const BROWSER_KEY = "browser";
// Who's who in storage, so it outlasts connections and hibernation
const HOST_TOKEN_KEY = "access:hostToken";
const LOCKED_KEY = "access:locked";
const MEMBER_PREFIX = "member:";
const BANNED_PREFIX = "banned:";

const REFUSALS = {
  locked: [CloseCode.ROOM_LOCKED, "Room locked"],
  removed: [CloseCode.REMOVED, "Removed by the host"],
} as const;

// Who someone is in the room. A null token is someone new, who gets one as
// they connect.
type Seat =
  | { role: RoomRole; token: string | null }
  | { refused: keyof typeof REFUSALS };

interface SeatClaim {
  browser: string | null;
  hostKey: string | null;
  token: string | null;
}

const claimFrom = (params: URLSearchParams): SeatClaim => ({
  browser: params.get(BROWSER_ID_PARAM),
  hostKey: params.get(HOST_KEY_PARAM),
  token: params.get(ROOM_TOKEN_PARAM),
});
// The clock of the client's latest presence, kept with the connection since
// the presence itself is lost to hibernation
const PRESENCE_CLOCK_KEY = "presenceClock";

type ConnectionState = Record<string, unknown> | null;

const stateOf = (connection: Connection) => connection.state as ConnectionState;

const awarenessIdsOf = (connection: Connection): number[] => {
  const ids = stateOf(connection)?.[AWARENESS_IDS_KEY];
  return Array.isArray(ids) ? ids : [];
};

// Missing for clients from before they sent it
const clientIdOf = (connection: Connection) => {
  const id = stateOf(connection)?.[CLIENT_ID_KEY];
  return typeof id === "number" ? id : undefined;
};

// Missing for connections from before roles
const roleOf = (connection: Connection): RoomRole | undefined => {
  const role = stateOf(connection)?.[ROLE_KEY];
  return role === "editor" || role === "host" || role === "viewer"
    ? role
    : undefined;
};

const roomTokenOf = (connection: Connection) => {
  const token = stateOf(connection)?.[ROOM_TOKEN_KEY];
  return typeof token === "string" ? token : undefined;
};

const browserOf = (connection: Connection) => {
  const browser = stateOf(connection)?.[BROWSER_KEY];
  return typeof browser === "string" ? browser : undefined;
};

const parseClientId = (value: string | null) => {
  const id = Number(value);
  return value && Number.isSafeInteger(id) && id >= 0 ? id : undefined;
};

const rememberPresenceClock = (
  connection: Connection,
  entries: AwarenessEntry[]
) => {
  const own = entries.find(
    ({ clientID }) => clientID === clientIdOf(connection)
  );
  if (!own) {
    return;
  }
  // A client that removed itself has already told everyone
  const clock = own.json === "null" ? undefined : own.clock;
  connection.setState((previous: ConnectionState) => ({
    ...previous,
    [PRESENCE_CLOCK_KEY]: clock,
  }));
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
  static callbackOptions = { debounceMaxWait: 10_000, debounceWait: 2000 };

  private get graceMs() {
    return Number(this.env.ROOM_GRACE_MS) || DEFAULT_GRACE_MS;
  }

  private get mediaEnabled() {
    return Boolean(this.env.SFU_APP_ID && this.env.SFU_APP_TOKEN);
  }

  // RPC from the Worker. Claims this room ID and returns the host's token,
  // or null if the ID is already taken
  async create(): Promise<string | null> {
    if (await this.exists()) {
      return null;
    }
    const hostToken = crypto.randomUUID();
    await this.ctx.storage.put({
      [CREATED_AT_KEY]: Date.now(),
      [HOST_TOKEN_KEY]: hostToken,
    });
    // Wiped like an emptied room if nobody ever joins
    await this.ctx.storage.setAlarm(Date.now() + this.graceMs);
    return hostToken;
  }

  // RPC from the Worker, for the join form to say why someone can't join
  async checkSeat(claim: SeatClaim): Promise<"locked" | "open" | "removed"> {
    const seat = await this.findSeat(claim);
    return "refused" in seat ? seat.refused : "open";
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
    for (let index = 0; index < count; index += 1) {
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
    const params = new URL(ctx.request.url).searchParams;
    const claim = claimFrom(params);
    const seat = await this.findSeat(claim);
    if ("refused" in seat) {
      const [code, reason] = REFUSALS[seat.refused];
      setTimeout(() => {
        connection.close(code, reason);
      }, 0);
      return;
    }
    const seatToken = seat.token ?? (await this.issueToken());
    // One connection for each seat, so a duplicated tab can't make a second
    // host. This one has no seat yet, so it stays.
    this.closeSeat(seatToken, CloseCode.REPLACED, "Opened in another tab");
    await this.ctx.storage.deleteAlarm();

    super.onConnect(connection, ctx);

    // Connection state is persisted with the WebSocket, so the token
    // survives hibernation. y-partyserver merges its own keys into it.
    const token = crypto.randomUUID();
    connection.setState((previous: ConnectionState) => ({
      ...previous,
      [CLIENT_ID_KEY]: parseClientId(params.get(CLIENT_ID_PARAM)),
      [MEDIA_TOKEN_KEY]: token,
      [BROWSER_KEY]: claim.browser ?? undefined,
      [ROLE_KEY]: seat.role,
      [ROOM_TOKEN_KEY]: seatToken,
    }));
    this.sendCustomMessage(
      connection,
      serialize({ enabled: this.mediaEnabled, token, type: "media" })
    );
    this.sendCustomMessage(
      connection,
      serialize({ token: seatToken, type: "token" })
    );
    await this.broadcastAccess();

    this.sendCustomMessage(
      connection,
      serialize({
        results: await this.readTerminalHistory(),
        type: "terminal-history",
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

      const filtered = filterAwarenessUpdate(
        decoding.readVarUint8Array(decoder),
        (clientID) => this.maySpeakFor(connection, clientID)
      );
      if (!filtered) {
        return;
      }
      rememberPresenceClock(connection, filtered.entries);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(encoder, filtered.update);
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
    this.announceDeparture(connection);
    super.onClose(connection, code, reason, wasClean);
    // Everyone else can edit, so only a host or viewer leaving changes access
    const role = roleOf(connection);
    if (role === "host" || role === "viewer") {
      await this.broadcastAccess(connection);
    }

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

  // Viewers can't change the shared document
  // biome-ignore lint/style/useThisInClassMethods: y-partyserver calls this override on the instance
  isReadOnly(connection: Connection) {
    return roleOf(connection) === "viewer";
  }

  onCustomMessage(connection: Connection, raw: string) {
    const message = parseClientMessage(raw);
    if (!message) {
      return;
    }
    const role = roleOf(connection);

    if (message.type === "terminal") {
      if (role === "viewer") {
        return;
      }
      this.broadcastCustomMessage(serialize(message), connection);
      this.storeTerminalResult(message.result).catch((error: unknown) => {
        console.error("Failed to store terminal output:", error);
      });
      return;
    }

    if (role !== "host") {
      return;
    }
    let task: Promise<void>;
    switch (message.type) {
      case "lock":
        task = this.setLocked(message.locked);
        break;
      case "make-host":
        task = this.makeHost(message.clientId);
        break;
      case "remove":
        task = this.remove(message.clientId);
        break;
      case "set-role":
        task = this.setRole(message.clientId, message.role);
        break;
      case "terminate":
        task = this.terminate();
        break;
      default:
        return;
    }
    task.catch((error: unknown) => {
      console.error(`Failed to handle ${message.type}:`, error);
    });
  }

  private async findSeat({
    browser,
    hostKey,
    token,
  }: SeatClaim): Promise<Seat> {
    const hostToken = await this.ctx.storage.get<string>(HOST_TOKEN_KEY);
    if (hostToken && token === hostToken) {
      return { role: "host", token };
    }
    // The host's browser takes the host's seat back only while it's empty,
    // so another tab there joins as someone else
    if (hostToken && hostKey === hostToken && !this.isSeatTaken(hostToken)) {
      return { role: "host", token: hostToken };
    }
    if (browser && (await this.ctx.storage.get(`${BANNED_PREFIX}${browser}`))) {
      return { refused: "removed" };
    }
    if (token) {
      const role = await this.ctx.storage.get<RoomRole>(
        `${MEMBER_PREFIX}${token}`
      );
      if (role) {
        return { role, token };
      }
    }
    if (await this.ctx.storage.get(LOCKED_KEY)) {
      return { refused: "locked" };
    }
    return { role: "editor", token: null };
  }

  private async issueToken() {
    const token = crypto.randomUUID();
    await this.ctx.storage.put(`${MEMBER_PREFIX}${token}`, "editor");
    return token;
  }

  private isSeatTaken(token: string) {
    return [...this.getConnections()].some(
      (connection) => roomTokenOf(connection) === token
    );
  }

  private closeSeat(token: string, code: number, reason: string) {
    for (const connection of this.getConnections()) {
      if (roomTokenOf(connection) === token) {
        connection.close(code, reason);
      }
    }
  }

  // The person's seat becomes the host's, so they keep it through reloads.
  // The old host's seat stays, as an editor's.
  private async makeHost(clientId: number) {
    const connections = [...this.getConnections()];
    const target = connections.find(
      (connection) => clientIdOf(connection) === clientId
    );
    const token = target && roomTokenOf(target);
    const oldToken = await this.ctx.storage.get<string>(HOST_TOKEN_KEY);
    if (!(token && oldToken) || roleOf(target) === "host") {
      return;
    }
    await this.ctx.storage.put({
      [HOST_TOKEN_KEY]: token,
      [`${MEMBER_PREFIX}${oldToken}`]: "editor",
    });
    await this.ctx.storage.delete(`${MEMBER_PREFIX}${token}`);
    for (const connection of connections) {
      const seat = roomTokenOf(connection);
      if (seat === token || seat === oldToken) {
        connection.setState((previous: ConnectionState) => ({
          ...previous,
          [ROLE_KEY]: seat === token ? "host" : "editor",
        }));
      }
    }
    await this.broadcastAccess();
  }

  // Closes the person's tabs and keeps their browser out from now on. A
  // host's other tabs can be removed, but never the host's browser.
  private async remove(clientId: number) {
    const connections = [...this.getConnections()];
    const target = connections.find(
      (connection) => clientIdOf(connection) === clientId
    );
    if (!target || roleOf(target) === "host") {
      return;
    }
    const token = roomTokenOf(target);
    const browser = browserOf(target);
    const isHostBrowser = connections.some(
      (connection) =>
        roleOf(connection) === "host" && browserOf(connection) === browser
    );
    const bannedBrowser = browser && !isHostBrowser ? browser : undefined;

    if (token) {
      await this.ctx.storage.delete(`${MEMBER_PREFIX}${token}`);
    }
    if (bannedBrowser) {
      await this.ctx.storage.put(`${BANNED_PREFIX}${bannedBrowser}`, true);
    }
    const [code, reason] = REFUSALS.removed;
    for (const connection of connections) {
      if (
        (token && roomTokenOf(connection) === token) ||
        (bannedBrowser && browserOf(connection) === bannedBrowser)
      ) {
        connection.close(code, reason);
      }
    }
  }

  private async setLocked(locked: boolean) {
    await this.ctx.storage.put(LOCKED_KEY, locked);
    await this.broadcastAccess();
  }

  // The role stays with the person's token, so it holds in every tab they
  // have open and when they come back
  private async setRole(clientId: number, role: "editor" | "viewer") {
    const target = [...this.getConnections()].find(
      (connection) => clientIdOf(connection) === clientId
    );
    const token = target && roomTokenOf(target);
    if (!token || roleOf(target) === "host") {
      return;
    }
    await this.ctx.storage.put(`${MEMBER_PREFIX}${token}`, role);
    for (const connection of this.getConnections()) {
      if (roomTokenOf(connection) === token) {
        connection.setState((previous: ConnectionState) => ({
          ...previous,
          [ROLE_KEY]: role,
        }));
      }
    }
    await this.broadcastAccess();
  }

  private async broadcastAccess(leaving?: Connection) {
    const hostIds: number[] = [];
    const viewerIds: number[] = [];
    for (const connection of this.getConnections()) {
      const clientId = clientIdOf(connection);
      if (clientId === undefined || connection.id === leaving?.id) {
        continue;
      }
      const role = roleOf(connection);
      if (role === "host") {
        hostIds.push(clientId);
      } else if (role === "viewer") {
        viewerIds.push(clientId);
      }
    }
    const locked = (await this.ctx.storage.get<boolean>(LOCKED_KEY)) ?? false;
    this.broadcastCustomMessage(
      serialize({ hostIds, locked, type: "access", viewerIds }),
      leaving
    );
  }

  // Everyone echoes the presence they hear, so a client speaks only for
  // itself. An echo of someone who has left would otherwise bring them back.
  private maySpeakFor(connection: Connection, clientID: number) {
    const ownId = clientIdOf(connection);
    if (ownId !== undefined && clientID !== ownId) {
      return false;
    }
    return !this.isOwnedByOther(clientID, connection);
  }

  // Hibernation empties the room's presence, and then super.onClose finds
  // nothing to remove and tells nobody the client left
  private announceDeparture(connection: Connection) {
    const clientID = clientIdOf(connection);
    const clock = stateOf(connection)?.[PRESENCE_CLOCK_KEY];
    if (
      clientID === undefined ||
      typeof clock !== "number" ||
      this.document.awareness.getStates().has(clientID)
    ) {
      return;
    }
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      encodeAwarenessRemoval(clientID, clock + 1)
    );
    const message = encoding.toUint8Array(encoder);
    for (const other of this.getConnections()) {
      if (other.id !== connection.id) {
        other.send(message);
      }
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

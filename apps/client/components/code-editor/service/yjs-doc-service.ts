/**
 * CRDT document transport for collaborative code editing.
 * Features:
 * - Yjs document lifecycle
 * - State-vector handshake with the server
 * - Incremental update relay over Socket.IO
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CodeServiceMsg } from "@codex/types/message";
import type { YjsUpdate } from "@codex/types/operation";
import * as Y from "yjs";

import { getSocket } from "@/lib/socket";

import { REMOTE_ORIGIN } from "./yjs-origins";

/** Name of the Y.Text holding the editor contents. Must match the server. */
export const CODE_TEXT_KEY = "monaco";

/**
 * Byte length of a Yjs update that carries no operations. A diff this small
 * says "you already have everything I have", so it is not worth a round trip.
 */
const EMPTY_UPDATE_BYTES = 2;

/**
 * Socket.IO delivers binary to the browser as an ArrayBuffer; Yjs needs a
 * Uint8Array view over it.
 */
const toUint8Array = (data: YjsUpdate): Uint8Array =>
  data instanceof Uint8Array ? data : new Uint8Array(data);

export interface CollabDoc {
  destroy: () => void;
  doc: Y.Doc;
  ytext: Y.Text;
}

/**
 * Create the room's replica of the shared document and keep it in sync.
 *
 * @returns The document, its text type, and a teardown function that removes
 * every socket and document listener this call registered.
 *
 * @remarks
 * The handshake is the standard three-step Yjs sync: we send our state vector,
 * the server replies with the operations we lack plus its own state vector,
 * and we push back whatever it lacks. It runs on creation and again on every
 * reconnect, so an interrupted session repairs itself instead of diverging.
 */
export const createCollabDoc = (): CollabDoc => {
  const socket = getSocket();
  const doc = new Y.Doc();
  const ytext = doc.getText(CODE_TEXT_KEY);

  const sendLocalUpdate = (update: Uint8Array, origin: unknown): void => {
    if (origin === REMOTE_ORIGIN) {
      return;
    }
    socket.emit(CodeServiceMsg.UPDATE_CODE, update);
  };

  const applyRemoteUpdate = (update: YjsUpdate): void => {
    Y.applyUpdate(doc, toUint8Array(update), REMOTE_ORIGIN);
  };

  const handleSync = (
    update: YjsUpdate,
    serverStateVector: YjsUpdate
  ): void => {
    applyRemoteUpdate(update);

    const diff = Y.encodeStateAsUpdate(doc, toUint8Array(serverStateVector));
    if (diff.length > EMPTY_UPDATE_BYTES) {
      socket.emit(CodeServiceMsg.UPDATE_CODE, diff);
    }
  };

  const requestSync = (): void => {
    socket.emit(CodeServiceMsg.SYNC_CODE, Y.encodeStateVector(doc));
  };

  doc.on("update", sendLocalUpdate);
  socket.on(CodeServiceMsg.UPDATE_CODE, applyRemoteUpdate);
  socket.on(CodeServiceMsg.SYNC_CODE, handleSync);
  socket.on("connect", requestSync);

  requestSync();

  return {
    doc,
    ytext,
    destroy: () => {
      // Remove by handler reference: the room page registers its own
      // listeners on this socket and must not lose them.
      socket.off(CodeServiceMsg.UPDATE_CODE, applyRemoteUpdate);
      socket.off(CodeServiceMsg.SYNC_CODE, handleSync);
      socket.off("connect", requestSync);
      doc.off("update", sendLocalUpdate);
      doc.destroy();
    },
  };
};

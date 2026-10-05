/**
 * Socket.IO server entry point for CodeX.
 * Features:
 * - WebSocket server setup
 * - Service initialization
 * - Message handling
 * - CORS configuration
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { App } from "uWebSockets.js";
import {
  CodeServiceMsg,
  PointerServiceMsg,
  RoomServiceMsg,
  ScrollServiceMsg,
  StreamServiceMsg,
} from "@codex/types/message";
import type { Cursor, YjsUpdate } from "@codex/types/operation";
import type { Pointer } from "@codex/types/pointer";
import type { Scroll } from "@codex/types/scroll";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@codex/types/socket-events";
import type { ExecutionResult } from "@codex/types/terminal";
import { Server } from "socket.io";

import * as codeService from "@/service/code-service";
import * as pointerService from "@/service/pointer-service";
import * as roomService from "@/service/room-service";
import * as scrollService from "@/service/scroll-service";
import * as userService from "@/service/user-service";
import * as webRTCService from "@/service/webrtc-service";

import { ALLOWED_ORIGINS, getCorsHeaders } from "./cors-config";

const PORT = 3001;
const MAX_NAME_LENGTH = 64;
const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;

const app = App();

const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  cors: {
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === "development") {
        callback(null, true);
        return;
      }

      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number])
      ) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed"));
      }
    },
    methods: ["GET", "POST"], // Socket.IO needs both
    credentials: true,
  },
  transports: ["websocket", "polling"],
  // Allow larger payloads for pasting large code blocks (default is 1MB)
  maxHttpBufferSize: 5e6, // 5MB
});
io.attachApp(app);
io.engine.on("connection", (rawSocket) => {
  rawSocket.request = null;
});

app.listen(PORT, (token) => {
  if (token) {
    console.log(`codex-server listening on port: ${PORT}`);
  } else {
    console.error(`Port ${PORT} is already in use`);
  }
});

app.get("/", (res, req) => {
  const origin = req.getHeader("origin");
  const headers = getCorsHeaders(origin);

  for (const [key, value] of Object.entries(headers)) {
    res.writeHeader(key, value);
  }
  res.writeHeader("Content-Type", "text/plain");

  res.end(
    "Hello from codex-server! Go to https://codex.dulapahv.dev/ to start coding."
  );
});

const isString = (value: unknown): value is string => typeof value === "string";

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isName = (value: unknown): value is string =>
  isString(value) &&
  value.trim().length > 0 &&
  value.trim().length <= MAX_NAME_LENGTH &&
  !CONTROL_CHARACTER_PATTERN.test(value);

// Handlers run on untrusted input, so a throw must not become an unhandled
// rejection that takes the whole process down.
const handle =
  <Args extends unknown[]>(handler: (...args: Args) => unknown) =>
  async (...args: Args): Promise<void> => {
    try {
      await handler(...args);
    } catch (error) {
      console.error(error);
    }
  };

io.on("connection", (socket) => {
  socket.on("ping", () => socket.emit("pong"));
  socket.on(
    RoomServiceMsg.CREATE,
    handle(async (name: unknown) => {
      if (isName(name)) {
        await roomService.create(socket, name.trim());
      }
    })
  );
  socket.on(
    RoomServiceMsg.JOIN,
    handle(async (roomID: unknown, name: unknown) => {
      if (isString(roomID) && isName(name)) {
        await roomService.join(socket, io, roomID, name.trim());
      }
    })
  );
  socket.on(
    RoomServiceMsg.LEAVE,
    handle(() => roomService.leave(socket, io))
  );
  socket.on(
    RoomServiceMsg.TERMINATE,
    handle(() => roomService.terminate(socket, io))
  );
  socket.on(
    RoomServiceMsg.SYNC_USERS,
    handle(() => roomService.getUsersInRoom(socket, io))
  );
  socket.on(
    CodeServiceMsg.SYNC_CODE,
    handle((stateVector: YjsUpdate) =>
      codeService.syncCode(socket, io, stateVector)
    )
  );
  socket.on(
    CodeServiceMsg.UPDATE_CODE,
    handle((update: YjsUpdate) => codeService.updateCode(socket, update))
  );
  socket.on(
    CodeServiceMsg.UPDATE_CURSOR,
    handle((cursor: Cursor) => userService.updateCursor(socket, cursor))
  );
  socket.on(
    CodeServiceMsg.SYNC_LANG,
    handle(() => codeService.syncLang(socket, io))
  );
  socket.on(
    CodeServiceMsg.UPDATE_LANG,
    handle((langID: unknown) => {
      if (isString(langID)) {
        codeService.updateLang(socket, langID);
      }
    })
  );
  socket.on(
    ScrollServiceMsg.UPDATE_SCROLL,
    handle((scroll: Scroll) => scrollService.updateScroll(socket, scroll))
  );
  socket.on(
    RoomServiceMsg.SYNC_MD,
    handle(() => roomService.syncNote(socket, io))
  );
  socket.on(
    RoomServiceMsg.UPDATE_MD,
    handle((note: unknown) => {
      if (isString(note)) {
        roomService.updateNote(socket, note);
      }
    })
  );
  socket.on(
    CodeServiceMsg.EXEC,
    handle((isExecuting: unknown) => {
      if (isBoolean(isExecuting)) {
        roomService.updateExecuting(socket, isExecuting);
      }
    })
  );
  socket.on(
    CodeServiceMsg.UPDATE_TERM,
    handle((data: unknown) => {
      if (isRecord(data) && isRecord(data.run)) {
        roomService.updateTerminal(socket, data as unknown as ExecutionResult);
      }
    })
  );
  socket.on(
    StreamServiceMsg.STREAM_READY,
    handle(() => webRTCService.onStreamReady(socket))
  );
  socket.on(
    StreamServiceMsg.SIGNAL,
    handle((data: unknown) => {
      if (isRecord(data) && isString(data.targetUserID)) {
        webRTCService.handleSignal(socket, data.targetUserID, data.signal);
      }
    })
  );
  socket.on(
    StreamServiceMsg.CAMERA_OFF,
    handle(() => webRTCService.onCameraOff(socket))
  );
  socket.on(
    StreamServiceMsg.MIC_STATE,
    handle((micOn: unknown) => {
      if (isBoolean(micOn)) {
        webRTCService.handleMicState(socket, micOn);
      }
    })
  );
  socket.on(
    StreamServiceMsg.SPEAKER_STATE,
    handle((speakersOn: unknown) => {
      if (isBoolean(speakersOn)) {
        webRTCService.handleSpeakerState(socket, speakersOn);
      }
    })
  );
  socket.on(
    PointerServiceMsg.POINTER,
    handle((pointer: Pointer) => pointerService.updatePointer(socket, pointer))
  );
  socket.on(
    "disconnecting",
    handle(() => roomService.leave(socket, io))
  );
});

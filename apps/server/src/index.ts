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

import type { SignalData } from 'simple-peer';
import { Server } from 'socket.io';
import { App } from 'uWebSockets.js';

import {
  CodeServiceMsg,
  PointerServiceMsg,
  RoomServiceMsg,
  ScrollServiceMsg,
  StreamServiceMsg,
} from '@codex/types/message';
import type { Cursor, EditOp } from '@codex/types/operation';
import type { Pointer } from '@codex/types/pointer';
import type { Scroll } from '@codex/types/scroll';
import type { ExecutionResult } from '@codex/types/terminal';

import * as codeService from '@/service/code-service';
import * as pointerService from '@/service/pointer-service';
import * as roomService from '@/service/room-service';
import * as scrollService from '@/service/scroll-service';
import * as userService from '@/service/user-service';
import * as webRTCService from '@/service/webrtc-service';

import {
  ALLOWED_ORIGINS,
  getCorsHeaders,
  isVercelDeployment,
} from './cors-config';

const PORT = 3001;

const app = App();

const io = new Server({
  cors: {
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
        return;
      }

      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number]) ||
        isVercelDeployment(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed'));
      }
    },
    methods: ['GET', 'POST'], // Socket.IO needs both
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});
io.attachApp(app);
io.engine.on('connection', (rawSocket) => {
  rawSocket.request = null;
});

app.listen(PORT, (token) => {
  if (!token) {
    console.warn(`Port ${PORT} is already in use`);
  }
  console.log(`codex-server listening on port: ${PORT}`);
});

app.get('/', (res, req) => {
  const origin = req.getHeader('origin');
  const headers = getCorsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    res.writeHeader(key, value);
  });
  res.writeHeader('Content-Type', 'text/plain');

  res.end(
    'Hello from codex-server! Go to https://codex.dulapahv.dev/ to start coding.',
  );
});

io.on('connection', (socket) => {
  socket.on('ping', () => socket.emit('pong'));
  socket.on(RoomServiceMsg.CREATE, async (name: string) =>
    roomService.create(socket, name),
  );
  socket.on(RoomServiceMsg.JOIN, async (roomID: string, name: string) =>
    roomService.join(socket, io, roomID, name),
  );
  socket.on(RoomServiceMsg.LEAVE, async () => roomService.leave(socket, io));
  socket.on(RoomServiceMsg.SYNC_USERS, async () =>
    roomService.getUsersInRoom(socket, io),
  );
  socket.on(CodeServiceMsg.SYNC_CODE, async () =>
    codeService.syncCode(socket, io),
  );
  socket.on(CodeServiceMsg.UPDATE_CODE, async (op: EditOp) =>
    codeService.updateCode(socket, op),
  );
  socket.on(CodeServiceMsg.UPDATE_CURSOR, async (cursor: Cursor) =>
    userService.updateCursor(socket, cursor),
  );
  socket.on(CodeServiceMsg.SYNC_LANG, async () =>
    codeService.syncLang(socket, io),
  );
  socket.on(CodeServiceMsg.UPDATE_LANG, async (langID: string) =>
    codeService.updateLang(socket, langID),
  );
  socket.on(ScrollServiceMsg.UPDATE_SCROLL, async (scroll: Scroll) =>
    scrollService.updateScroll(socket, scroll),
  );
  socket.on(RoomServiceMsg.SYNC_MD, async () => {
    roomService.syncNote(socket, io);
  });
  socket.on(RoomServiceMsg.UPDATE_MD, async (note: string) =>
    roomService.updateNote(socket, note),
  );
  socket.on(CodeServiceMsg.EXEC, async (isExecuting: boolean) =>
    roomService.updateExecuting(socket, isExecuting),
  );
  socket.on(CodeServiceMsg.UPDATE_TERM, async (data: ExecutionResult) =>
    roomService.updateTerminal(socket, data),
  );
  socket.on(StreamServiceMsg.STREAM_READY, () =>
    webRTCService.onStreamReady(socket),
  );
  socket.on(StreamServiceMsg.SIGNAL, (signal: SignalData) =>
    webRTCService.handleSignal(socket, signal),
  );
  socket.on(StreamServiceMsg.CAMERA_OFF, () =>
    webRTCService.onCameraOff(socket),
  );
  socket.on(StreamServiceMsg.MIC_STATE, (micOn: boolean) =>
    webRTCService.handleMicState(socket, micOn),
  );
  socket.on(StreamServiceMsg.SPEAKER_STATE, (speakersOn: boolean) =>
    webRTCService.handleSpeakerState(socket, speakersOn),
  );
  socket.on(PointerServiceMsg.POINTER, (pointer: Pointer) =>
    pointerService.updatePointer(socket, pointer),
  );
  socket.on('disconnecting', () => roomService.leave(socket, io));
});

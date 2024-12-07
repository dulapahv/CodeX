import type { SignalData } from 'simple-peer';
import { Server } from 'socket.io';
import { App } from 'uWebSockets.js';

import {
  CodeServiceMsg,
  RoomServiceMsg,
  ScrollServiceMsg,
  StreamServiceMsg,
} from '../../common/types/message';
import type { Cursor, EditOp } from '../../common/types/operation';
import type { Scroll } from '../../common/types/scroll';
import type { ExecutionResult } from '../../common/types/terminal';
import * as codeService from './service/code-service';
import * as roomService from './service/room-service';
import * as scrollService from './service/scroll-service';
import * as userService from './service/user-service';
import * as webRTCService from './service/webrtc-service';

const PORT = 3001;

// Base allowed origins that are always allowed
const baseOrigins = [
  'http://localhost:3000',
  'https://kasca.dulapahv.dev',
  'https://dev-kasca.dulapahv.dev',
];

const isVercelDeployment = (origin: string): boolean => {
  // Following Vercel's Git deployment URL pattern:
  // <project-name>-<unique-hash>-<scope-slug>.vercel.app
  // We'll match for our project name "kasca-client"
  const vercelPattern =
    /^https:\/\/kasca-client-[a-zA-Z0-9]+-[a-zA-Z0-9-]+\.vercel\.app$/;
  return vercelPattern.test(origin);
};

const app = App();

const io = new Server({
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if origin is in baseOrigins or matches Vercel deployment pattern
      if (baseOrigins.includes(origin) || isVercelDeployment(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});
io.attachApp(app);
io.engine.on('connection', (rawSocket) => {
  rawSocket.request = null;
});

app.listen(PORT, (token) => {
  if (!token) {
    console.warn(`Port ${PORT} is already in use`);
  }
  console.log(`kasca-server listening on port: ${PORT}`);
});

app.get('/', (res) => {
  res.writeHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      message:
        'Hello from kasca-server! Go to https://kasca.dulapahv.dev to use the app :D',
    }),
  );
});

io.on('connection', (socket) => {
  socket.on(RoomServiceMsg.CREATE, async (name: string) =>
    roomService.create(socket, name),
  );
  socket.on(RoomServiceMsg.JOIN, async (roomID: string, name: string) =>
    roomService.join(socket, io, roomID, name),
  );
  socket.on(RoomServiceMsg.LEAVE, async () => roomService.leave(socket, io));
  socket.on(RoomServiceMsg.SYNC_USERS, async () => {
    roomService.getUsersInRoom(socket, io);
  });
  socket.on(CodeServiceMsg.SYNC_CODE, async () => {
    codeService.syncCode(socket, io);
  });
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
  socket.on(CodeServiceMsg.EXEC, async (isExecuting: boolean) => {
    roomService.updateExecuting(socket, isExecuting);
  });
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
  socket.on('disconnecting', () => roomService.leave(socket, io));
});

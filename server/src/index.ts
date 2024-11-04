import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';

import {
  CodeServiceMsg,
  RoomServiceMsg,
  UserServiceMsg,
} from '../../common/types/message';
import { Cursor, EditOp } from '../../common/types/operation';
import * as codeService from './service/code-service';
import * as roomService from './service/room-service';
import * as userService from './service/user-service';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://kasca.dulapahv.dev',
  'https://dev-kasca.dulapahv.dev',
];

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Hello from kasca-server!' });
});

io.on('connection', (socket) => {
  socket.on(RoomServiceMsg.CREATE_ROOM, async (name) =>
    roomService.create(socket, name)
  );
  socket.on(RoomServiceMsg.JOIN_ROOM, async (roomID, name) =>
    roomService.join(socket, io, roomID, name)
  );
  socket.on(RoomServiceMsg.LEAVE_ROOM, async (roomID) =>
    roomService.leave(socket, io, roomID)
  );
  socket.on(UserServiceMsg.DISCONNECT, async () =>
    userService.disconnect(socket)
  );
  socket.on(RoomServiceMsg.GET_USERS, async () => {
    roomService.getUsersInRoom(socket, io);
  });
  socket.on(CodeServiceMsg.GET_CODE, async () => {
    codeService.syncCode(socket, io);
  });
  socket.on(CodeServiceMsg.CODE_TX, async (operation: EditOp) => {
    codeService.updateCode(socket, operation);
  });
  socket.on(UserServiceMsg.CURSOR_TX, async (cursor: Cursor) => {
    userService.updateCursor(socket, cursor);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, function () {
  console.log(`kasca-server listening on port: ${PORT}`);
});

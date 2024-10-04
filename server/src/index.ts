import { createServer } from 'http';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';

import {
  EditServiceMsg,
  RoomServiceMsg,
  UserServiceMsg,
} from '../../common/types/message';
import { TextOperation } from '../../common/types/ot';
import * as codeService from './service/code-service';
import * as roomService from './service/room-service';
import * as userService from './service/user-service';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://occp.dulapahv.dev',
  'https://dev-occp.dulapahv.dev',
];

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Hello from occp-server!' });
});

io.on('connection', (socket) => {
  socket.on(RoomServiceMsg.CREATE_ROOM, async (name) =>
    roomService.createAndJoin(socket, name)
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
  socket.on(RoomServiceMsg.GET_USERS, async (roomID) => {
    await roomService.getUsersInRoom(socket, io, roomID);
  });
  socket.on(EditServiceMsg.SEND_EDIT, (roomID, operation: TextOperation) => {
    codeService.updateCode(socket, roomID, operation);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, function () {
  console.log(`occp-server listening on port: ${PORT}`);
});

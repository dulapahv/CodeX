import { createServer } from 'http';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';

import { RoomServiceMsg, UserServiceMsg } from '../../common/types/message';
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

// interface UpdateUsersListAndCodeMapParams {
//   io: Server;
//   socket: Socket;
//   roomID: string;
// }

// async function updateUserslistAndCodeMap({
//   io,
//   socket,
//   roomID,
// }: UpdateUsersListAndCodeMapParams): Promise<void> {
//   socket
//     .in(roomID)
//     .emit('member left', { username: socketIDToUsersMap[socket.id] });

//   // update the user list
//   delete socketIDToUsersMap[socket.id];
//   const userslist: string[] = await getUsersInRoom({ io, roomID });
//   socket.in(roomID).emit('updating client list', { userslist });

//   if (userslist.length === 0) {
//     delete roomIDToCodeMap[roomID];
//   }
// }

io.on('connection', (socket) => {
  socket.on(RoomServiceMsg.CREATE_ROOM, async (name) =>
    roomService.createAndJoin(socket, io, name)
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
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, function () {
  console.log(`occp-server listening on port: ${PORT}`);
});

import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://occp.dulapahv.dev',
  'https://dev-occp.dulapahv.dev',
];

// app.use(cors({ origin: allowedOrigins }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

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
interface SocketIDToUsersMapType {
  [key: string]: string;
}

interface RoomIDToCodeMapType {
  [key: string]: string;
}

// Store the mapping of socket ID to username
const socketIDToUsersMap: SocketIDToUsersMapType = {};

// Store the mapping of room ID to code
const roomIDToCodeMap: RoomIDToCodeMapType = {};

interface GetUsersInRoomParams {
  io: Server;
  roomID: string;
}

async function getUsersInRoom({
  io,
  roomID,
}: GetUsersInRoomParams): Promise<string[]> {
  const socketList = await io.in(roomID).fetchSockets();
  const userslist: string[] = [];
  socketList.forEach((socket) => {
    if (socket.id in socketIDToUsersMap) {
      userslist.push(socketIDToUsersMap[socket.id]);
    }
  });
  return userslist;
}

interface UpdateUsersListAndCodeMapParams {
  io: Server;
  socket: Socket;
  roomID: string;
}

async function updateUserslistAndCodeMap({
  io,
  socket,
  roomID,
}: UpdateUsersListAndCodeMapParams): Promise<void> {
  socket
    .in(roomID)
    .emit('member left', { username: socketIDToUsersMap[socket.id] });

  // update the user list
  delete socketIDToUsersMap[socket.id];
  const userslist: string[] = await getUsersInRoom({ io, roomID });
  socket.in(roomID).emit('updating client list', { userslist });

  if (userslist.length === 0) {
    delete roomIDToCodeMap[roomID];
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('create-room', async (name) => {
    // create a new room
    const roomID = uuidv4().replace(/-/g, '');
    socketIDToUsersMap[socket.id] = name; // store the mapping of socket ID to username
    console.log(`User ${name} created room ${roomID}`);

    // join the room
    socket.join(roomID);
    socket.emit('room-created', roomID);
    console.log(`User ${name} joined room ${roomID}`);
    console.log(await getUsersInRoom({ io, roomID }));
  });

  // when users join a room
  socket.on('join-room', async (roomID, name) => {
    // check if room exists
    if (!io.sockets.adapter.rooms.has(roomID)) {
      // if room does not exist, emit room-not-found event
      console.log(`Room ${roomID} does not exist`);
      socket.emit('room-not-found', roomID);
      return;
    }

    // join the room
    socket.join(roomID);
    socketIDToUsersMap[socket.id] = name; // store the mapping of socket ID to username
    socket.emit('room-joined', name);
    console.log(`User ${name} joined room ${roomID}`);

    const userslist = await getUsersInRoom({ io, roomID });
    console.log(userslist);
  });

  // when users leave a room
  socket.on('disconnect', function () {
    socket.emit('user-disconnected', socketIDToUsersMap[socket.id]);
    console.log(`User disconnected: ${socketIDToUsersMap[socket.id]}`);
    delete socketIDToUsersMap[socket.id];

    if (Object.keys(socketIDToUsersMap).length === 0) {
      console.log('No more users in the room. Room is now deleted.');
    } else {
      console.log(`Remaining users: ${Object.values(socketIDToUsersMap)}`);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, function () {
  console.log(`occp-server listening on port: ${PORT}`);
});

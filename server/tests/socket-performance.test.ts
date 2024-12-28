import { performance } from 'perf_hooks';
import { io as Client } from 'socket.io-client';

import { CodeServiceMsg, RoomServiceMsg } from '../../common/types/message';
import type { EditOp } from '../../common/types/operation';

/**
 * Local: http://localhost:3001
 * Server: https://kasca-server.dulapahv.dev
 */
const SERVER_URL = 'http://localhost:3001';

describe('Socket.IO Performance', () => {
  let senderSocket: ReturnType<typeof Client>;
  let receiverSocket: ReturnType<typeof Client>;
  let roomId: string;
  let senderId: string;

  const createSocket = () => {
    console.log('\n⚡ Creating new Socket.IO connection...');
    return Client(SERVER_URL);
  };

  beforeAll(async () => {
    console.log('\n🔧 Setting up test environment...');
    console.log('📡 Connecting to server:', SERVER_URL);

    // Create sender socket and room
    senderSocket = createSocket();

    // Wait for sender connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Sender connection timeout')),
        5000,
      );

      senderSocket.on('connect_error', (error) => {
        console.error('❌ Sender connection error:', error);
        clearTimeout(timeout);
        reject(error);
      });

      senderSocket.on('connect', () => {
        console.log('✅ Sender connected successfully');
        console.log('🔌 Socket ID:', senderSocket.id);
        clearTimeout(timeout);
        resolve();
      });
    });

    // Create a room using sender socket
    await new Promise<void>((resolve, reject) => {
      console.log('\n🏠 Creating new room...');
      const timeout = setTimeout(
        () => reject(new Error('Room creation timeout')),
        5000,
      );

      senderSocket.emit(RoomServiceMsg.CREATE, 'Sender');

      senderSocket.once(
        RoomServiceMsg.CREATE,
        (receivedRoomId: string, receivedCustomId: string) => {
          console.log('✅ Room created successfully');
          console.log('🏷️  Room ID:', receivedRoomId);
          console.log('👤 Sender ID:', receivedCustomId);
          roomId = receivedRoomId;
          senderId = receivedCustomId;
          clearTimeout(timeout);
          resolve();
        },
      );
    });

    // Create and connect receiver socket
    console.log('\n📱 Setting up receiver connection...');
    receiverSocket = createSocket();

    // Wait for receiver connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Receiver connection timeout')),
        5000,
      );

      receiverSocket.on('connect_error', (error) => {
        console.error('❌ Receiver connection error:', error);
        clearTimeout(timeout);
        reject(error);
      });

      receiverSocket.on('connect', () => {
        console.log('✅ Receiver connected successfully');
        console.log('🔌 Socket ID:', receiverSocket.id);
        clearTimeout(timeout);
        resolve();
      });
    });

    // Join the room with receiver socket
    await new Promise<void>((resolve, reject) => {
      console.log('\n🚪 Receiver joining room...');
      const timeout = setTimeout(
        () => reject(new Error('Room join timeout')),
        5000,
      );

      receiverSocket.emit(RoomServiceMsg.JOIN, roomId, 'Receiver');

      receiverSocket.once(RoomServiceMsg.JOIN, (receivedCustomId: string) => {
        console.log('✅ Receiver joined room successfully');
        console.log('👤 Receiver ID:', receivedCustomId);
        clearTimeout(timeout);
        resolve();
      });
    });

    console.log('\n✨ Test environment setup complete');
  }, 15000);

  afterAll(() => {
    console.log('\n🧹 Cleaning up test environment...');
    if (senderSocket?.connected) {
      console.log('👋 Disconnecting sender socket');
      senderSocket.disconnect();
    }
    if (receiverSocket?.connected) {
      console.log('👋 Disconnecting receiver socket');
      receiverSocket.disconnect();
    }
    console.log('✅ Cleanup complete');
  });

  test('should have both sockets connected and in the same room', () => {
    console.log('\n🔍 Checking socket connections...');
    console.log('Sender connected:', senderSocket.connected);
    console.log('Receiver connected:', receiverSocket.connected);
    console.log('Room ID:', roomId);
    console.log('Sender ID:', senderId);

    expect(senderSocket.connected).toBe(true);
    expect(receiverSocket.connected).toBe(true);
    expect(roomId).toBeDefined();
    expect(senderId).toBeDefined();
  });

  test('message latency', async () => {
    console.log('\n⚡ Starting message latency test...');
    console.log('📍 Testing with room:', roomId);

    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      console.log(`\n🔄 Iteration ${i + 1}/${iterations}`);
      const start = performance.now();
      const op: EditOp = ['test content', 1, 1, 1, 1];

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Code update timeout')),
          5000,
        );

        receiverSocket.once(
          CodeServiceMsg.UPDATE_CODE,
          (receivedOp: EditOp) => {
            clearTimeout(timeout);
            const end = performance.now();
            const duration = end - start;
            times.push(duration);
            console.log(`✅ Message received in ${duration.toFixed(2)}ms`);
            resolve();
          },
        );

        console.log('📤 Sending test message...');
        senderSocket.emit(CodeServiceMsg.UPDATE_CODE, op);
      });

      await new Promise((resolve) => setTimeout(resolve, 1));
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log('\n📊 Latency Test Results:');
    console.log(`📈 Average: ${avg.toFixed(2)}ms`);
    console.log(`⬇️  Min: ${min.toFixed(2)}ms`);
    console.log(`⬆️  Max: ${max.toFixed(2)}ms`);

    expect(avg).toBeLessThan(500);
  }, 10000);

  test('connection stress test', async () => {
    console.log('\n🏋️ Starting connection stress test...');

    const numConnections = 5;
    const clients: ReturnType<typeof Client>[] = [];
    const connectTimes: number[] = [];

    for (let i = 0; i < numConnections; i++) {
      console.log(`\n🔄 Creating client ${i + 1}/${numConnections}`);
      const start = performance.now();
      const client = createSocket();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Connection timeout')),
          5000,
        );

        client.on('connect', async () => {
          console.log(`✅ Client ${i + 1} connected successfully`);
          clearTimeout(timeout);
          console.log(`🚪 Client ${i + 1} joining room...`);
          client.emit(RoomServiceMsg.JOIN, roomId, `StressUser${i}`);

          client.once(RoomServiceMsg.JOIN, () => {
            const duration = performance.now() - start;
            connectTimes.push(duration);
            clients.push(client);
            console.log(
              `✅ Client ${i + 1} joined room in ${duration.toFixed(2)}ms`,
            );
            resolve();
          });
        });

        client.on('connect_error', (error) => {
          console.error(`❌ Client ${i + 1} connection error:`, error);
          clearTimeout(timeout);
          reject(error);
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const avgConnectTime =
      connectTimes.reduce((a, b) => a + b) / connectTimes.length;
    console.log('\n📊 Connection Test Results:');
    console.log(`✅ Successfully connected ${numConnections} clients`);
    console.log(`⏱️ Average connection time: ${avgConnectTime.toFixed(2)}ms`);

    console.log('\n🧹 Cleaning up stress test clients...');
    clients.forEach((client, index) => {
      console.log(`👋 Disconnecting client ${index + 1}`);
      client.disconnect();
    });

    expect(avgConnectTime).toBeLessThan(1000);
  }, 10000);

  test('code sync performance', async () => {
    console.log('\n📝 Starting code sync performance test...');

    const codeLength = 1000;
    const code = 'x'.repeat(codeLength);
    const iterations = 5;
    const times: number[] = [];

    console.log(`📦 Test payload size: ${codeLength / 1000}KB`);
    console.log(`🔄 Number of iterations: ${iterations}`);

    for (let i = 0; i < iterations; i++) {
      console.log(`\n🔄 Iteration ${i + 1}/${iterations}`);
      const start = performance.now();
      const op: EditOp = [code, 1, 1, 1, code.length + 1];

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Code sync timeout')),
          5000,
        );

        receiverSocket.once(
          CodeServiceMsg.UPDATE_CODE,
          (receivedOp: EditOp) => {
            clearTimeout(timeout);
            const duration = performance.now() - start;
            times.push(duration);
            console.log(`✅ Sync completed in ${duration.toFixed(2)}ms`);
            resolve();
          },
        );

        console.log('📤 Sending code update...');
        senderSocket.emit(CodeServiceMsg.UPDATE_CODE, op);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    console.log('\n📊 Code Sync Test Results:');
    console.log(`📈 Average sync time: ${avg.toFixed(2)}ms`);
    console.log(`📦 Payload size: ${codeLength / 1000}KB`);

    expect(avg).toBeLessThan(500);
  }, 10000);
});

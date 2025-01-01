import { performance } from 'perf_hooks';
import { io as Client } from 'socket.io-client';

import { CodeServiceMsg, RoomServiceMsg } from '../../common/types/message';
import type { EditOp } from '../../common/types/operation';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

interface OperationTiming {
  total: number;
  setup: number;
  execution: number;
  verification: number;
}

describe('Edit Operation Tests', () => {
  let senderSocket: ReturnType<typeof Client>;
  let receiverSocket: ReturnType<typeof Client>;
  let roomId: string;
  const timings: OperationTiming[] = [];

  const createSocket = () => {
    console.log('\n⚡ Creating new Socket.IO connection...');
    return Client(SERVER_URL);
  };

  beforeAll(async () => {
    console.log('\n🔧 Setting up test environment for edit operations...');
    console.log('📡 Connecting to server:', SERVER_URL);

    // Create sender socket and room
    senderSocket = createSocket();
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
      senderSocket.once(RoomServiceMsg.CREATE, (receivedRoomId: string) => {
        console.log('✅ Room created successfully');
        console.log('🏷️  Room ID:', receivedRoomId);
        roomId = receivedRoomId;
        clearTimeout(timeout);
        resolve();
      });
    });

    // Create and connect receiver socket
    console.log('\n📱 Setting up receiver connection...');
    receiverSocket = createSocket();
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
      receiverSocket.once(RoomServiceMsg.JOIN, () => {
        console.log('✅ Receiver joined room successfully');
        clearTimeout(timeout);
        resolve();
      });
    });

    console.log('\n✨ Edit operation test environment setup complete');
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

  // Helper function to clear room content
  async function clearRoomContent(): Promise<void> {
    console.log('\n🧹 Clearing room content...');

    // Get current content
    const currentContent = await new Promise<string>((resolve) => {
      console.log('📥 Fetching current content...');
      senderSocket.emit(CodeServiceMsg.SYNC_CODE);
      senderSocket.once(CodeServiceMsg.SYNC_CODE, resolve);
    });

    // If there's content, clear it
    if (currentContent) {
      console.log('📝 Current content length:', currentContent.length);
      const lines = currentContent.split('\n').length;
      const clearOp: EditOp = ['', 1, 1, lines + 1, 1];

      await new Promise<void>((resolve) => {
        receiverSocket.once(CodeServiceMsg.UPDATE_CODE, () => {
          console.log('✅ Content cleared successfully');
          setTimeout(resolve, 1);
        });
        console.log('🗑️ Sending clear operation...');
        senderSocket.emit(CodeServiceMsg.UPDATE_CODE, clearOp);
      });
    } else {
      console.log('ℹ️ Room already empty');
    }

    // Verify it's cleared
    const clearedContent = await new Promise<string>((resolve) => {
      senderSocket.emit(CodeServiceMsg.SYNC_CODE);
      senderSocket.once(CodeServiceMsg.SYNC_CODE, resolve);
    });

    expect(clearedContent).toBe('');
    console.log('✅ Room content verification complete');
  }

  /**
   * Each index of the edit operation array corresponds to:
   * 0: Text to insert
   * 1: Start line number
   * 2: Start column number
   * 3: End line number
   * 4: End column number
   */
  const testCases = [
    {
      name: 'Simple insertion at start',
      initialCode: 'world',
      operation: ['hello ', 1, 1, 1, 1],
      expectedResult: 'hello world',
    },
    {
      name: 'Replace word in middle',
      initialCode: 'The quick brown fox',
      operation: ['lazy', 1, 5, 1, 10],
      expectedResult: 'The lazy brown fox',
    },
    {
      name: 'Add new line',
      initialCode: 'First line',
      operation: ['\nSecond line', 1, 11, 1, 11],
      expectedResult: 'First line\nSecond line',
    },
    {
      name: 'Delete empty lines',
      initialCode: 'First\n\n\nLast',
      operation: ['', 2, 1, 4, 1],
      expectedResult: 'First\nLast',
    },
    {
      name: 'Insert at non-existent line',
      initialCode: 'Line 1',
      operation: ['Line 3', 3, 1, 3, 1],
      expectedResult: 'Line 1\n\nLine 3',
    },
    {
      name: 'Multi-line insertion',
      initialCode: 'Start\nEnd',
      operation: ['Middle\nLine', 2, 1, 2, 1],
      expectedResult: 'Start\nMiddle\nLineEnd',
    },
    {
      name: 'Delete partial line',
      initialCode: 'Hello beautiful world',
      operation: ['', 1, 6, 1, 16],
      expectedResult: 'Hello world',
    },
    // Additional test cases for edge cases
    {
      name: 'Handle very long line',
      initialCode: 'x'.repeat(1000),
      operation: ['test', 1, 500, 1, 500],
      expectedResult: 'x'.repeat(499) + 'test' + 'x'.repeat(501),
    },
    {
      name: 'Multiple consecutive newlines',
      initialCode: 'Start',
      operation: ['\n\n\n\n', 1, 6, 1, 6],
      expectedResult: 'Start\n\n\n\n',
    },
  ];

  test.each(testCases)(
    '$name',
    async ({ name, initialCode, operation, expectedResult }) => {
      console.log(`\n🧪 Running test case: ${name}`);

      const timing: OperationTiming = {
        total: 0,
        setup: 0,
        execution: 0,
        verification: 0,
      };

      const startTotal = performance.now();

      // Clear the room content
      await clearRoomContent();

      // Set initial content and wait for receiver to get it
      const startSetup = performance.now();
      console.log('📝 Setting initial content:', initialCode);
      await new Promise<void>((resolve) => {
        receiverSocket.once(CodeServiceMsg.UPDATE_CODE, () => {
          console.log('✅ Initial content set successfully');
          setTimeout(resolve, 1);
        });
        senderSocket.emit(CodeServiceMsg.UPDATE_CODE, [
          initialCode,
          1,
          1,
          1,
          1,
        ]);
      });

      // Verify initial content
      const initialState = await new Promise<string>((resolve) => {
        console.log('🔍 Verifying initial content...');
        senderSocket.emit(CodeServiceMsg.SYNC_CODE);
        senderSocket.once(CodeServiceMsg.SYNC_CODE, resolve);
      });

      expect(initialState).toBe(initialCode);
      console.log('✅ Initial content verified');
      timing.setup = performance.now() - startSetup;

      // Apply test operation
      const startExecution = performance.now();
      console.log('🔄 Applying edit operation:', JSON.stringify(operation));
      await new Promise<void>((resolve) => {
        receiverSocket.once(CodeServiceMsg.UPDATE_CODE, () => {
          console.log('✅ Edit operation applied successfully');
          setTimeout(resolve, 1);
        });
        senderSocket.emit(CodeServiceMsg.UPDATE_CODE, operation);
      });
      timing.execution = performance.now() - startExecution;

      // Get and verify final state
      const startVerification = performance.now();
      const finalCode = await new Promise<string>((resolve) => {
        console.log('🔍 Verifying final content...');
        senderSocket.emit(CodeServiceMsg.SYNC_CODE);
        senderSocket.once(CodeServiceMsg.SYNC_CODE, resolve);
      });

      expect(finalCode).toBe(expectedResult);
      timing.verification = performance.now() - startVerification;
      timing.total = performance.now() - startTotal;

      // Log performance metrics
      console.log('\n⏱️  Performance Metrics:');
      console.log(`Setup time: ${timing.setup.toFixed(2)}ms`);
      console.log(`Execution time: ${timing.execution.toFixed(2)}ms`);
      console.log(`Verification time: ${timing.verification.toFixed(2)}ms`);
      console.log(`Total time: ${timing.total.toFixed(2)}ms`);

      timings.push(timing);

      console.log('✅ Final content verified');
      console.log(
        '📊 Test result:',
        finalCode === expectedResult ? 'PASS' : 'FAIL',
      );

      // Clean up
      await clearRoomContent();
    },
  );

  test('handles stress test of rapid edits', async () => {
    console.log('\n🏋️ Starting rapid edits stress test...');

    await clearRoomContent();

    const edits = Array(20)
      .fill(null)
      .map((_, i) => [`${i}`, 1, 1, 1, 1]);

    console.log(`📊 Preparing ${edits.length} rapid edits...`);

    let completedEdits = 0;
    const editTimings: number[] = [];

    await Promise.all(
      edits.map(
        (edit, index) =>
          new Promise<void>((resolve) => {
            const startEdit = performance.now();
            receiverSocket.once(CodeServiceMsg.UPDATE_CODE, () => {
              completedEdits++;
              editTimings.push(performance.now() - startEdit);
              console.log(`✅ Edit ${index + 1}/${edits.length} completed`);
              setTimeout(resolve, 1);
            });
            console.log(`📤 Sending edit ${index + 1}/${edits.length}...`);
            senderSocket.emit(CodeServiceMsg.UPDATE_CODE, edit);
          }),
      ),
    );

    // Calculate and log stress test metrics
    const avgEditTime =
      editTimings.reduce((a, b) => a + b) / editTimings.length;
    const minEditTime = Math.min(...editTimings);
    const maxEditTime = Math.max(...editTimings);

    console.log('\n📊 Stress Test Performance Metrics:');
    console.log(`Average edit time: ${avgEditTime.toFixed(2)}ms`);
    console.log(`Minimum edit time: ${minEditTime.toFixed(2)}ms`);
    console.log(`Maximum edit time: ${maxEditTime.toFixed(2)}ms`);
    console.log(`Total edits completed: ${completedEdits}`);

    // Final state verification
    console.log('🔍 Verifying final state after stress test...');
    const finalCode = await new Promise<string>((resolve) => {
      senderSocket.emit(CodeServiceMsg.SYNC_CODE);
      senderSocket.once(CodeServiceMsg.SYNC_CODE, resolve);
    });

    const expectedResult = Array(20)
      .fill(null)
      .map((_, i) => 19 - i)
      .join('');

    expect(finalCode).toBe(expectedResult);

    // Log final results
    console.log('\n📈 Overall Test Results:');
    if (timings.length > 0) {
      const avgTotal =
        timings.reduce((acc, t) => acc + t.total, 0) / timings.length;
      const avgSetup =
        timings.reduce((acc, t) => acc + t.setup, 0) / timings.length;
      const avgExec =
        timings.reduce((acc, t) => acc + t.execution, 0) / timings.length;
      const avgVerify =
        timings.reduce((acc, t) => acc + t.verification, 0) / timings.length;

      console.log('\n⏱️  Average Timing Metrics:');
      console.log(`Setup time: ${avgSetup.toFixed(2)}ms`);
      console.log(`Execution time: ${avgExec.toFixed(2)}ms`);
      console.log(`Verification time: ${avgVerify.toFixed(2)}ms`);
      console.log(`Total time: ${avgTotal.toFixed(2)}ms`);
    }

    console.log(`✅ Completed ${completedEdits} edits successfully`);
    console.log(
      '🎯 Final content matches expected result:',
      finalCode === expectedResult,
    );
  });
});

/**
 * Storage service class for managing room and user state.
 * Features:
 * - Room ID persistence
 * - User ID management
 * - Follow mode state
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

interface StorageData {
  roomId: string | null;
  userId: string | null;
  followUserId: string | null;
}

export class Storage {
  private data: StorageData;

  constructor() {
    this.data = {
      roomId: null,
      userId: null,
      followUserId: null,
    };
  }

  // Set the room ID
  setRoomId(roomId: string | null): void {
    this.data.roomId = roomId;
  }

  // Get the room ID
  getUserId(): string | null {
    return this.data.userId;
  }

  // Set the user ID
  setUserId(userId: string | null): void {
    this.data.userId = userId;
  }

  // Get the user ID to follow
  getFollowUserId(): string | null {
    return this.data.followUserId;
  }

  // Set the user ID to follow
  setFollowUserId(followUserId: string | null): void {
    this.data.followUserId = followUserId;
  }

  // Get all storage data
  getAll(): StorageData {
    return { ...this.data };
  }

  // Clear all storage data
  clear(): void {
    this.data = {
      roomId: null,
      userId: null,
      followUserId: null,
    };
  }
}

// Export singleton instance
export const storage = new Storage();

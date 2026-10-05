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
  followUserId: string | null;
  userId: string | null;
  username: string | null;
}

export class Storage {
  private data: StorageData;

  constructor() {
    this.data = {
      userId: null,
      username: null,
      followUserId: null,
    };
  }

  // Get the user ID
  getUserId(): string | null {
    return this.data.userId;
  }

  // Set the user ID
  setUserId(userId: string | null): void {
    this.data.userId = userId;
  }

  // Get the username used to join the room
  getUsername(): string | null {
    return this.data.username;
  }

  // Set the username used to join the room
  setUsername(username: string | null): void {
    this.data.username = username;
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
      userId: null,
      username: null,
      followUserId: null,
    };
  }
}

// Export singleton instance
export const storage = new Storage();

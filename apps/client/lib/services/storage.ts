/**
 * Storage service class for managing room and user state.
 * Features:
 * - User ID management
 * - Username for rejoining after a reconnect
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
  private readonly listeners = new Set<() => void>();

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
    this.notify();
  }

  // Subscribe to user ID changes, for useSyncExternalStore
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
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
    this.notify();
  }
}

// Export singleton instance
export const storage = new Storage();

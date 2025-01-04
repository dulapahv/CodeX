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

  // Room ID methods
  getRoomId(): string | null {
    return this.data.roomId;
  }

  setRoomId(roomId: string | null): void {
    this.data.roomId = roomId;
  }

  // User ID methods
  getUserId(): string | null {
    return this.data.userId;
  }

  setUserId(userId: string | null): void {
    this.data.userId = userId;
  }

  // Follow User ID methods
  getFollowUserId(): string | null {
    return this.data.followUserId;
  }

  setFollowUserId(followUserId: string | null): void {
    this.data.followUserId = followUserId;
  }

  // Combined methods
  getAll(): StorageData {
    return { ...this.data };
  }

  clear(): void {
    this.data = {
      roomId: null,
      userId: null,
      followUserId: null,
    };
  }

  // Check if session is active
  hasActiveSession(): boolean {
    return Boolean(this.data.roomId && this.data.userId);
  }
}

// Export singleton instance
export const storage = new Storage();

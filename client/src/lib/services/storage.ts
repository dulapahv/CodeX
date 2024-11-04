interface StorageData {
  roomId: string | null;
  userId: string | null;
}

export class Storage {
  private data: StorageData;

  constructor() {
    this.data = {
      roomId: null,
      userId: null,
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

  // Combined methods
  getAll(): StorageData {
    return { ...this.data };
  }

  clear(): void {
    this.data = {
      roomId: null,
      userId: null,
    };
  }

  // Check if session is active
  hasActiveSession(): boolean {
    return Boolean(this.data.roomId && this.data.userId);
  }
}

// Export singleton instance
export const storage = new Storage();

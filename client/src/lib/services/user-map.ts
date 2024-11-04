import type { User } from "../../../../common/types/user";

export class UserMap {
  private users: Map<string, string>;

  constructor() {
    this.users = new Map();
  }

  // Add a new user or update existing user
  add(id: string, username: string): void {
    this.users.set(id, username);
  }

  // Add multiple users at once
  addBulk(usersDict: Record<string, string>): void {
    Object.entries(usersDict).forEach(([id, username]) => {
      this.add(id, username);
    });
  }

  // Get username by ID
  get(id: string): string | undefined {
    return this.users.get(id);
  }

  // Delete a user by ID
  delete(id: string): boolean {
    return this.users.delete(id);
  }

  // Clear all users
  clear(): void {
    this.users.clear();
  }

  // Get all users as an array of User objects
  getAll(): User[] {
    return Array.from(this.users.entries()).map(([id, username]) => ({
      id,
      username,
    }));
  }

  // Get raw map of id -> username
  getRawMap(): Record<string, string> {
    return Object.fromEntries(this.users);
  }

  // Get total number of users
  size(): number {
    return this.users.size;
  }

  // Check if user exists
  has(id: string): boolean {
    return this.users.has(id);
  }
}

// Create a singleton instance
export const userMap = new UserMap();

/**
 * User management class for handling user data and color assignments.
 * Features:
 * - Username mapping
 * - Color generation and caching
 * - Bulk operations support
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { User } from '@codex/types/user';

import { getBackgroundColor, getTextColor } from '@/lib/utils';

interface UserData {
  username: string;
  backgroundColor: string;
  textColor: string;
}

export class UserMap {
  private users: Map<string, UserData>;

  constructor() {
    this.users = new Map();
  }

  // Calculate and cache colors when adding a user
  private calculateUserData(username: string): UserData {
    return {
      username,
      backgroundColor: getBackgroundColor(username),
      textColor: getTextColor(getBackgroundColor(username)),
    };
  }

  // Add a new user or update existing user
  add(id: string, username: string): void {
    this.users.set(id, this.calculateUserData(username));
  }

  // Add multiple users at once
  addBulk(usersDict: Record<string, string>): void {
    Object.entries(usersDict).forEach(([id, username]) => {
      this.add(id, username);
    });
  }

  // Get username by ID
  get(id: string): string | undefined {
    return this.users.get(id)?.username;
  }

  // Delete a user by ID
  delete(id: string): boolean {
    return this.users.delete(id);
  }

  // Clear all users
  clear(): void {
    this.users.clear();
  }

  // Get cached background color by ID
  getBackgroundColor(id: string): string {
    return this.users.get(id)?.backgroundColor ?? getBackgroundColor('');
  }

  // Get cached text color by ID
  getTextColor(id: string): string {
    return this.users.get(id)?.textColor ?? getTextColor('');
  }

  // Get all colors for a user
  getColors(id: string): { backgroundColor: string; color: string } {
    const userData = this.users.get(id);
    return {
      backgroundColor: userData?.backgroundColor ?? getBackgroundColor(''),
      color: userData?.textColor ?? getTextColor(''),
    };
  }

  // Get all users as an array of User objects
  getAll(): User[] {
    return Array.from(this.users.entries()).map(([id, data]) => ({
      id,
      username: data.username,
    }));
  }
}

// Create a singleton instance
export const userMap = new UserMap();

import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { socket } from "@/lib/socket";

import { RoomServiceMsg } from "../../../common/types/message";
import { storage } from "./services/storage";

export function createRoom(name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    socket.emit(RoomServiceMsg.CREATE, name);
    socket.on(RoomServiceMsg.CREATED, (roomId: string, userID: string) => {
      storage.setRoomId(roomId);
      storage.setUserId(userID);

      resolve(roomId);
    });
  });
}

export function joinRoom(roomId: string, name: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    socket.emit(RoomServiceMsg.JOIN, roomId, name);
    socket.on(RoomServiceMsg.NOT_FOUND, () => {
      reject("Room does not exist. Please check the room ID and try again.");
    });
    socket.on(RoomServiceMsg.JOINED, (userID: string) => {
      storage.setRoomId(roomId);
      storage.setUserId(userID);

      resolve(true);
    });
  });
}

export function leaveRoom(roomId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.emit(RoomServiceMsg.LEAVE, roomId);
    storage.clear();
  });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
};

/**
 * Fast color generation for real-time collaboration
 * Uses a combination of hash and golden ratio for quick but good distribution
 * Caches results to improve performance
 */
const colorCache = new Map();

export const getBackgroundColor = (name: string): string => {
  // Check if color is already in the cache
  if (colorCache.has(name)) {
    return colorCache.get(name);
  }

  // Fast hash - just use first and last few characters
  let hash = 0;
  const len = name.length;
  // Use first 2 and last 2 chars for speed
  const chars = [
    name.charCodeAt(0),
    name.charCodeAt(Math.min(1, len - 1)),
    name.charCodeAt(Math.max(len - 2, 0)),
    name.charCodeAt(len - 1),
  ];

  for (let i = 0; i < chars.length; i++) {
    hash = ((hash << 5) - hash + chars[i]) >>> 0;
  }

  // Use golden ratio for better distribution
  // This creates a more pleasing spread of colors
  const golden_ratio = 0.618033988749895;
  const hue = ((hash * golden_ratio) % 1) * 360;

  // Use fixed saturation and lightness for consistent readability
  const saturation = 60; // More muted colors
  const lightness = 65; // Not too dark, not too light

  const backgroundColor = hslToHex(hue, saturation, lightness);

  // Cache the result
  colorCache.set(name, backgroundColor);

  return backgroundColor;
};

/**
 * Simplified HSL to Hex conversion
 */
const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };

  const rgb = [f(0), f(8), f(4)].map((x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${rgb.join("")}`;
};

/**
 * Calculates relative luminance of a color
 * @param hexColor - Color in hex format
 * @returns Luminance value between 0 and 1
 */
const getLuminance = (hexColor: string): number => {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert hex to rgb
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Calculate luminance using relative luminance formula
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  return luminance;
};

/**
 * Determines text color based on background luminance
 * @param backgroundColor - Background color in hex format
 * @returns Either black or white depending on contrast
 */
export const getTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // Use white text on dark backgrounds (luminance < 0.7)
  return luminance < 0.7 ? "#fff" : "#000";
};

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { RoomServiceMsg } from '@common/types/message';

import { getSocket } from '@/lib/socket';
import { formatRoomId } from '@/utils/format-room-id';

import { storage } from './services/storage';

export const createRoom = (name: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    socket.emit(RoomServiceMsg.CREATE, name);
    socket.on(RoomServiceMsg.CREATED, (roomId: string, userID: string) => {
      roomId = formatRoomId(roomId);

      storage.setRoomId(roomId);
      storage.setUserId(userID);

      resolve(roomId);
    });
  });
};

export const joinRoom = (roomId: string, name: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();

    roomId = roomId.replace(/-/g, '');

    socket.emit(RoomServiceMsg.JOIN, roomId, name);
    socket.on(RoomServiceMsg.NOT_FOUND, () => {
      reject('Room does not exist. Please check the room ID and try again.');
    });
    socket.on(RoomServiceMsg.JOINED, (userID: string) => {
      storage.setRoomId(roomId);
      storage.setUserId(userID);
      resolve(true);
    });
  });
};

export const leaveRoom = (roomId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();

    socket.emit(RoomServiceMsg.LEAVE, roomId);
    storage.clear();
  });
};

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const parseError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Enhanced color generation for real-time collaboration
 * Uses improved hashing and color space manipulation for more distinct colors
 */
const colorCache = new Map();

export const getBackgroundColor = (name: string): string => {
  if (colorCache.has(name)) {
    return colorCache.get(name);
  }

  // Improved hash function using more characters
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash + char) >>> 0;
  }

  // Use multiple golden ratios for better distribution across different dimensions
  const golden_ratio_conjugate = 0.618033988749895;
  const golden_ratio_squared = 0.381966011250105;

  // Generate primary hue using golden ratio
  let hue = ((hash * golden_ratio_conjugate) % 1) * 360;

  // Use secondary golden ratio to vary saturation within a vibrant range
  const saturationBase = 85; // Higher base saturation for more vibrant colors
  const saturationRange = 15; // Allow some variation
  const saturation =
    saturationBase + ((hash * golden_ratio_squared) % 1) * saturationRange;

  // Vary lightness while keeping colors distinct
  const lightnessBase = 55; // Slightly darker base
  const lightnessRange = 20; // More variation
  const lightness =
    lightnessBase +
    ((hash * golden_ratio_conjugate * golden_ratio_squared) % 1) *
      lightnessRange;

  // Shift hue based on name length to add more variation
  hue = (hue + name.length * 37) % 360;

  const backgroundColor = hslToHex(hue, saturation, lightness);
  colorCache.set(name, backgroundColor);
  return backgroundColor;
};

/**
 * Improved HSL to Hex conversion with gamma correction
 */
const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));

    // Add gamma correction for better visual distribution
    return Math.round(Math.pow(color, 1 / 2.2) * 255)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Enhanced luminance calculation using sRGB coefficients
 */
const getLuminance = (hexColor: string): number => {
  const hex = hexColor.replace('#', '');

  // Convert hex to rgb with gamma correction
  const toLinear = (v: number): number => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(parseInt(hex.substring(0, 2), 16));
  const g = toLinear(parseInt(hex.substring(2, 4), 16));
  const b = toLinear(parseInt(hex.substring(4, 6), 16));

  // Use precise sRGB luminance coefficients
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Get text color with improved contrast ratio calculation
 */
export const getTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // Use a more precise threshold for WCAG AA compliance
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

/**
 * Helper function to check contrast ratio between colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

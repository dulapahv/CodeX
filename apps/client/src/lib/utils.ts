/**
 * Common utility functions used across the application.
 * Features:
 * - Room management
 * - CSS class merging
 * - Error parsing
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { RoomServiceMsg } from '@codex/types/message';

import { GITHUB_CLIENT_ID, GITHUB_OAUTH_URL } from '@/lib/constants';
import { getSocket } from '@/lib/socket';

import { storage } from './services/storage';

export const leaveRoom = (): Promise<void> => {
  return new Promise(() => {
    const socket = getSocket();

    socket.emit(RoomServiceMsg.LEAVE);
    storage.clear();
  });
};

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const parseError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  return 'An unknown error occurred';
};

export const loginWithGithub = () => {
  const width = 790;
  const height = 720;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  if (window.authWindow?.closed === false) {
    window.authWindow.focus();
  } else {
    window.authWindow = window.open(
      `${GITHUB_OAUTH_URL}/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo`,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`,
    );
  }
};

/**
 * Color generation and text contrast calculation functions.
 */
const colorCache = new Map();

export const getBackgroundColor = (name: string): string => {
  if (colorCache.has(name)) {
    return colorCache.get(name);
  }

  // Simple hash function for consistent color generation
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash + char) >>> 0;
  }

  // Golden ratio constants for color generation
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
  return luminance < 0.5 ? '#fff' : '#000';
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

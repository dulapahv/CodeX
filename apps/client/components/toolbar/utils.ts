/**
 * Utility functions for toolbar menu actions and system detection.
 * Features:
 * - OS detection
 * - Menu command handlers
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { parseError } from "@/lib/utils";

import type { ShortcutPlatform } from "./types";

const IOS_DEVICE_PATTERN = /iPad|iPhone|iPod/u;
const ANDROID_PATTERN = /Android/u;
const WINDOWS_PATTERN = /Win/u;
const MAC_PATTERN = /Mac/u;
const LINUX_PATTERN = /Linux/u;

/**
 * Get the current operating system
 * @returns The current operating system
 */
export const getOS = ():
  | "iOS"
  | "Android"
  | "Windows"
  | "Mac OS"
  | "Linux"
  | "Unknown" => {
  const { platform, userAgent } = navigator;
  // Detect iOS devices (iPhone, iPad, iPod)
  if (IOS_DEVICE_PATTERN.test(userAgent)) {
    return "iOS";
  }
  // Detect Android
  if (ANDROID_PATTERN.test(userAgent)) {
    return "Android";
  }
  // Detect Windows
  if (WINDOWS_PATTERN.test(platform)) {
    return "Windows";
  }
  // Detect macOS
  if (MAC_PATTERN.test(platform)) {
    return "Mac OS";
  }
  // Detect Linux (includes Linux-based OS but not Android)
  if (LINUX_PATTERN.test(platform)) {
    return "Linux";
  }
  // Fallback for older iOS devices that might not have the userAgent string
  if (["iPhone", "iPad", "iPod"].includes(platform)) {
    return "iOS";
  }
  return "Unknown";
};

/**
 * Get the platform Monaco resolves keybindings for. Like Monaco, anything
 * neither Apple nor Windows (Android included) counts as Linux.
 * @returns The keybinding platform
 */
export const getShortcutPlatform = (): ShortcutPlatform => {
  const os = getOS();
  if (os === "Mac OS" || os === "iOS") {
    return "mac";
  }
  return os === "Windows" ? "windows" : "linux";
};

export interface FileContent {
  content: string;
  name: string;
}

/**
 * Asks the user to pick one or more local files
 * @param onPick - Called with the chosen files, unless the picker is cancelled
 */
export const pickLocalFiles = (onPick: (files: File[]) => void): void => {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.onchange = () => {
    const files = [...(input.files ?? [])];
    if (files.length > 0) {
      onPick(files);
    }
  };
  input.click();
};

// Images and other binary files hold null characters, which text never has
const BINARY_MARKER = "\u0000";

/**
 * Reads local files as text, skipping any that can't be read or aren't text
 * @param files - The files to read
 * @returns Each readable file's name and text
 */
export const readLocalFiles = async (files: File[]): Promise<FileContent[]> => {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const content = await file.text();
      if (content.includes(BINARY_MARKER)) {
        throw new Error(`${file.name} isn't a text file`);
      }
      return { content, name: file.name };
    })
  );
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to read file:", parseError(result.reason));
    }
  }
  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
};

/**
 * Downloads text as a file
 * @param content - The file's text
 * @param fileName - Name to save it under
 */
export const saveLocal = (content: string, fileName: string): void => {
  // A generic type, so browsers keep names like Dockerfile as they are
  // instead of adding .txt
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

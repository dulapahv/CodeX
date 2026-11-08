/**
 * Utility functions for toolbar menu actions and system detection.
 * Features:
 * - OS detection
 * - Menu command handlers
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";

import { parseError } from "@/lib/utils";

import type { ShortcutPlatform } from "./types";

const IOS_DEVICE_PATTERN = /iPad|iPhone|iPod/u;
const ANDROID_PATTERN = /Android/u;
const WINDOWS_PATTERN = /Win/u;
const MAC_PATTERN = /Mac/u;
const LINUX_PATTERN = /Linux/u;
const LEADING_DOT_PATTERN = /^\./u;

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

interface Language {
  alias: string;
  extensions: readonly string[];
  id: string;
}

/**
 * Cache for Monaco languages to avoid repeated API calls
 */
let languagesCache: Language[] | null = null;

/**
 * Gets the file extension for a given language ID
 * @param languageId - The Monaco language identifier
 * @returns The preferred file extension including the dot, or '.txt' if none found
 */
function getFileExtension(languageId: string, monaco: Monaco): string {
  if (!languagesCache) {
    languagesCache = monaco.languages.getLanguages().map(
      (entry): Language => ({
        alias: entry.aliases?.[0] ?? "Unknown",
        extensions: entry.extensions ?? [],
        id: entry.id,
      })
    );
  }

  const language = languagesCache.find((lang) => lang.id === languageId);
  return language?.extensions[0]
    ? `.${language.extensions[0].replace(LEADING_DOT_PATTERN, "")}`
    : ".txt";
}

/**
 * Asks the user to pick a local file
 * @param onPick - Called with the chosen file, unless the picker is cancelled
 */
export const pickLocalFile = (onPick: (file: File) => void): void => {
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) {
      onPick(file);
    }
  };
  input.click();
};

/**
 * Replaces the editor's content and picks the language from the file name
 * @param monaco - Monaco instance for language detection
 * @param editor - Monaco editor instance
 * @param fileName - Name of the file, used to detect its language
 * @param content - The file's text
 */
export const loadIntoEditor = (
  monaco: Monaco,
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  fileName: string,
  content: string
): void => {
  const extension = fileName.split(".").pop() || "";
  const language = monaco.languages
    .getLanguages()
    .find((lang) =>
      lang.extensions?.some((ext) => ext.replace(".", "") === extension)
    );

  editor.setValue(content);
  const model = editor.getModel();
  if (model) {
    monaco.editor.setModelLanguage(model, language?.id || "plaintext");
  }
};

/**
 * Reads a local file into the Monaco editor
 * @param monaco - Monaco instance for language detection
 * @param editor - Monaco editor instance
 * @param file - The file to open
 */
export const openLocalFile = async (
  monaco: Monaco,
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  file: File
): Promise<void> => {
  try {
    loadIntoEditor(monaco, editor, file.name, await file.text());
  } catch (error) {
    console.error("Failed to read file:", parseError(error));
  }
};

/**
 * Saves the current editor content to a local file
 * @param editor - Monaco editor instance
 * @param filename - Optional custom filename without extension
 * @throws Error if editor is null or getValue() fails
 */
export const saveLocal = (
  monaco: Monaco,
  editor: monacoEditor.editor.IStandaloneCodeEditor | null,
  filename = `codex-${new Date().toLocaleString("en-GB").replace(/[/:, ]/gu, "-")}`
): void => {
  if (!editor) {
    throw new Error("Editor instance is required");
  }

  try {
    const code = editor.getValue();
    const model = editor.getModel();

    if (!model) {
      throw new Error("Editor model not found");
    }

    const extension = getFileExtension(model.getLanguageId(), monaco);
    const fullFilename = `${filename}${extension}`;

    // Create blob and download
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fullFilename;

    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to save file: ${parseError(error)}`, {
      cause: error,
    });
  }
};

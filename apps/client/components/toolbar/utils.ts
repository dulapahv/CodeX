/**
 * Utility functions for toolbar menu actions and system detection.
 * Features:
 * - OS detection
 * - Menu command handlers
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { type Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { toast } from 'sonner';

import { parseError } from '@/lib/utils';

/**
 * Get the current operating system
 * @returns The current operating system
 */
export const getOS = ():
  | 'iOS'
  | 'Android'
  | 'Windows'
  | 'Mac OS'
  | 'Linux'
  | 'Unknown' => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  // Detect iOS devices (iPhone, iPad, iPod)
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
  // Detect Android
  if (/Android/.test(userAgent)) return 'Android';
  // Detect Windows
  if (/Win/.test(platform)) return 'Windows';
  // Detect macOS
  if (/Mac/.test(platform)) return 'Mac OS';
  // Detect Linux (includes Linux-based OS but not Android)
  if (/Linux/.test(platform)) return 'Linux';
  // Fallback for older iOS devices that might not have the userAgent string
  if (['iPhone', 'iPad', 'iPod'].includes(platform)) return 'iOS';
  return 'Unknown';
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
      (language): Language => ({
        alias: language.aliases?.[0] ?? 'Unknown',
        extensions: language.extensions ?? [],
        id: language.id,
      }),
    );
  }

  const language = languagesCache.find((lang) => lang.id === languageId);
  return language?.extensions[0]
    ? `.${language.extensions[0].replace(/^\./, '')}`
    : '.txt';
}

/**
 * Opens a local file and sets its content in the Monaco editor
 * @param monaco - Monaco instance for language detection
 * @param editor - Monaco editor instance
 * @throws Error if editor is null or file reading fails
 */
export const openLocal = (
  monaco: Monaco,
  editor: monaco.editor.IStandaloneCodeEditor | null,
): void => {
  // Create input element
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '*.*';

  // Handle file selection
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !editor) return;

    // Create file reader
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;

      // Try to detect language from file extension
      const extension = file.name.split('.').pop() || '';
      const languages = monaco.languages.getLanguages();
      const language = languages.find((lang) =>
        lang.extensions?.some((ext) => ext.replace('.', '') === extension),
      );

      // Set content and language (default to plaintext)
      editor.setValue(content);
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language?.id || 'plaintext');
      }
      toast.success('File opened successfully');
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
      throw new Error('Failed to read file');
    };

    reader.readAsText(file);
  };

  // Trigger file dialog
  input.click();
};

/**
 * Saves the current editor content to a local file
 * @param editor - Monaco editor instance
 * @param filename - Optional custom filename without extension
 * @throws Error if editor is null or getValue() fails
 */
export const saveLocal = (
  monaco: Monaco,
  editor: monaco.editor.IStandaloneCodeEditor | null,
  filename = `codex-${new Date().toLocaleString('en-GB').replace(/[/:, ]/g, '-')}`,
): void => {
  if (!editor) {
    throw new Error('Editor instance is required');
  }

  try {
    const code = editor.getValue();
    const model = editor.getModel();

    if (!model) {
      throw new Error('Editor model not found');
    }

    const extension = getFileExtension(model.getLanguageId(), monaco);
    const fullFilename = `${filename}${extension}`;

    // Create blob and download
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fullFilename;

    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to save file: ${parseError(error)}`);
  }
};

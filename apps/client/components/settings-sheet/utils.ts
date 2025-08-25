/**
 * Utility functions for editor settings management.
 * Features:
 * - Settings export to JSON
 * - Title case formatting
 * - Settings file handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ChangeEvent } from 'react';

import type * as monaco from 'monaco-editor';
import { toast } from 'sonner';

import { EDITOR_SETTINGS_KEY } from '@/lib/constants';

// Convert camelCase to Title Case
export const formatTitle = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exportSettings = (settings: Record<string, any>) => {
  try {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codex-editor-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export settings:', error);
  }
};

export const importSettings = (
  editor: monaco.editor.IStandaloneCodeEditor,
  setSettings: (settings: Record<string, unknown>) => void,
  event: ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const imported = JSON.parse(content);

      if (typeof imported !== 'object' || imported === null) {
        throw new Error('Invalid settings format');
      }

      editor.updateOptions(imported);
      setSettings(imported);
      localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(imported));

      toast.success('Settings imported successfully!');
    } catch (error) {
      console.error('Failed to import settings:', error);
      toast.error('Failed to import settings. Please check the file format.');
    }
  };

  reader.readAsText(file);
  event.target.value = '';
};

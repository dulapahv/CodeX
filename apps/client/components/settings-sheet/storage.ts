/**
 * Saves the editor settings a user changed, in the nested shape Monaco takes,
 * such as `{ minimap: { side: "left" } }`. Settings left at their default
 * aren't saved, so a later default from Monaco still reaches the user.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";

import { EDITOR_SETTINGS_KEY } from "@/lib/constants";

import {
  APP_DEFAULTS,
  getSettingDefinitions,
  getSettingValue,
  isRecord,
  isSameValue,
  isValidValue,
  type SettingDefinition,
} from "./catalog";

export type EditorSettings = Record<string, unknown>;

const assignSettingValue = (
  target: EditorSettings,
  key: string,
  value: unknown
) => {
  const parts = key.split(".");
  const last = parts.pop() ?? key;
  let parent = target;
  for (const part of parts) {
    const child = parent[part];
    parent[part] = isRecord(child) ? { ...child } : {};
    parent = parent[part] as EditorSettings;
  }
  parent[last] = value;
};

// The options object that changes just this setting
export const toEditorOptions = (key: string, value: unknown) => {
  const options: EditorSettings = {};
  assignSettingValue(options, key, value);
  return options;
};

export const withSettingValue = (
  settings: EditorSettings,
  key: string,
  value: unknown
) => {
  const next = { ...settings };
  assignSettingValue(next, key, value);
  return next;
};

export const withoutSettingValue = (
  settings: EditorSettings,
  key: string
): EditorSettings => {
  const [first, ...rest] = key.split(".");
  if (rest.length === 0) {
    const { [first]: _removed, ...remaining } = settings;
    return remaining;
  }
  const child = settings[first];
  if (!isRecord(child)) {
    return settings;
  }
  const nextChild = withoutSettingValue(child, rest.join("."));
  if (Object.keys(nextChild).length === 0) {
    const { [first]: _removed, ...remaining } = settings;
    return remaining;
  }
  return { ...settings, [first]: nextChild };
};

// Keeps known settings with a valid value that differs from the default
export const cleanSettings = (
  raw: unknown,
  definitions: SettingDefinition[]
): EditorSettings => {
  const cleaned: EditorSettings = {};
  for (const setting of definitions) {
    const value = getSettingValue(raw, setting.key);
    if (
      value !== undefined &&
      isValidValue(setting, value) &&
      !isSameValue(value, setting.defaultValue)
    ) {
      assignSettingValue(cleaned, setting.key, value);
    }
  }
  return cleaned;
};

export const readStoredSettings = (): unknown => {
  try {
    return JSON.parse(localStorage.getItem(EDITOR_SETTINGS_KEY) ?? "{}");
  } catch {
    return {};
  }
};

export const writeStoredSettings = (settings: EditorSettings) => {
  try {
    if (Object.keys(settings).length === 0) {
      localStorage.removeItem(EDITOR_SETTINGS_KEY);
    } else {
      localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch {
    // Storage can be full or blocked, and the settings still apply for now
  }
};

// Older saves held every option, with values as the editor worked them out
const LEGACY_SAVE_MARKER = "ariaLabel";

// Drops what an older save copied from the editor rather than what the user
// chose, by comparing with a fresh editor before anything is applied
const dropLegacyValues = (
  raw: unknown,
  monaco: Monaco,
  editor: monacoEditor.editor.IStandaloneCodeEditor
) => {
  if (!(isRecord(raw) && LEGACY_SAVE_MARKER in raw)) {
    return raw;
  }
  const options = monaco.editor.EditorOption as Record<string, unknown>;
  const kept: EditorSettings = {};
  for (const [key, value] of Object.entries(raw)) {
    const id = options[key];
    const current: unknown =
      typeof id === "number"
        ? editor.getOption(id as monacoEditor.editor.EditorOption)
        : undefined;
    const isCopied =
      isRecord(value) && isRecord(current)
        ? value.enabled === current.enabled
        : isSameValue(value, current);
    if (!isCopied) {
      kept[key] = value;
    }
  }
  return kept;
};

// The options to start the editor with, tidying up the saved ones first
export const loadEditorOptions = (
  monaco: Monaco,
  editor: monacoEditor.editor.IStandaloneCodeEditor
): EditorSettings => {
  const settings = cleanSettings(
    dropLegacyValues(readStoredSettings(), monaco, editor),
    getSettingDefinitions(monaco)
  );
  writeStoredSettings(settings);
  return { ...APP_DEFAULTS, ...settings };
};

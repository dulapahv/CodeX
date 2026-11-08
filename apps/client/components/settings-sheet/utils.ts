/**
 * Downloads the changed editor settings as a JSON file, in the same shape
 * Monaco takes, so the file can be imported again or reused elsewhere.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { EditorSettings } from "./storage";

export const exportSettings = (settings: EditorSettings) => {
  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "codex-editor-settings.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

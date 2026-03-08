/**
 * Editor configuration component for Monaco editor settings.
 * Features:
 * - Settings search and filtering
 * - Import/export settings
 * - Real-time setting updates
 * - Settings persistence
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import { Download, Folder, Search } from "lucide-react";
import type * as monaco from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EDITOR_SETTINGS_KEY } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { SELECT_OPTIONS } from "../constants";
import type { EditorOption } from "../types";
import { exportSettings, formatTitle, importSettings } from "../utils";

interface EditorConfigProps {
  className?: string;
  editor: monaco.editor.IStandaloneCodeEditor;
  monaco: Monaco;
}

export function EditorConfig({ monaco, editor, className }: EditorConfigProps) {
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<
    monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions
  >(() => {
    try {
      const savedSettings = localStorage.getItem(EDITOR_SETTINGS_KEY);
      return savedSettings ? JSON.parse(savedSettings) : {};
    } catch (error) {
      console.error("Failed to load saved settings:", error);
      return {};
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface EditorOptionsInternal extends monaco.editor.IEditorOptions {
    _values: unknown[];
  }

  useEffect(() => {
    // Load saved settings from localStorage and apply them
    const savedSettings = localStorage.getItem(EDITOR_SETTINGS_KEY);
    let storedSettings = {};

    if (savedSettings) {
      try {
        storedSettings = JSON.parse(savedSettings);
        editor.updateOptions(storedSettings);
      } catch (error) {
        console.error("Failed to load saved settings:", error);
      }
    }

    // Get current editor options to fill in any missing settings
    // @ts-expect-error - Monaco editor internal API
    const currentValues = (editor.getOptions() as EditorOptionsInternal)
      ._values;
    const optionKeys = Object.keys(monaco.editor.EditorOption).filter((key) =>
      Number.isNaN(Number(key))
    );

    // Merge stored settings with current editor values
    const mergedSettings = optionKeys.reduce(
      (acc, key, index) => {
        // Skip if we already have this setting
        if (key in storedSettings) {
          return acc;
        }

        const value = currentValues[index];

        // Only include valid values
        if (value !== null && value !== undefined) {
          if (typeof value === "object" && "enabled" in value) {
            // @ts-expect-error - Monaco editor internal API
            acc[key] = { enabled: value.enabled };
          } else if (typeof value !== "object") {
            // @ts-expect-error - Monaco editor internal API
            acc[key] = value;
          }
        }

        return acc;
      },
      { ...storedSettings }
    );

    setSettings(mergedSettings);
  }, [editor, monaco.editor.EditorOption]);

  const editorOptions = useMemo(() => {
    const options: Record<string, EditorOption> = {};
    // @ts-expect-error - Monaco editor internal API
    const values = (editor.getOptions() as EditorOptionsInternal)._values;

    Object.keys(monaco.editor.EditorOption)
      .filter((key) => Number.isNaN(Number(key)))
      .forEach((key, index) => {
        const value = values[index];
        if (value === undefined) {
          return;
        }

        // Handle objects with 'enabled' property (like minimap)
        if (typeof value === "object" && value !== null && "enabled" in value) {
          options[`${key}.enabled`] = {
            title: formatTitle(key),
            type: "boolean",
            currentValue: value.enabled,
          };
          return;
        }

        // Skip other objects or unsupported types
        if (typeof value === "object" || value === null) {
          return;
        }

        const type = typeof value;
        // if (!['boolean', 'string', 'number'].includes(type)) return;

        const resolveOptionType = ():
          | "boolean"
          | "number"
          | "select"
          | "string"
          | "text" => {
          if (type === "boolean") {
            return "boolean";
          }
          if (type === "number") {
            return "number";
          }
          if (
            type === "string" &&
            typeof value === "string" &&
            ["on", "off"].includes(value)
          ) {
            return "select";
          }
          if (SELECT_OPTIONS[key]) {
            return "select";
          }
          return "text";
        };

        options[key] = {
          title: formatTitle(key),
          type: resolveOptionType(),
          currentValue: value,
          options:
            type !== "boolean" && type !== "number"
              ? SELECT_OPTIONS[key] || ["on", "off"]
              : undefined,
        };
      });

    return options;
  }, [editor, monaco.editor.EditorOption]);

  const filteredSettings = useMemo(() => {
    const searchLower = search.toLowerCase();
    return Object.entries(editorOptions).filter(([_key, option]) =>
      option.title.toLowerCase().includes(searchLower)
    );
  }, [search, editorOptions]);

  const updateSetting = useCallback(
    (key: string, value: unknown) => {
      // For boolean settings that use .enabled format
      if (key.endsWith(".enabled")) {
        const mainKey = key.replace(".enabled", "");
        const newSettings = {
          ...settings,
          [mainKey]: { enabled: value },
        };

        editor.updateOptions({
          [mainKey]: { enabled: value },
        });

        setSettings(newSettings);
        localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(newSettings));
        return;
      }

      // For all other settings
      const newSettings = {
        ...settings,
        [key]: value,
      };

      editor.updateOptions({ [key]: value });
      setSettings(newSettings);
      localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(newSettings));
    },
    [editor, settings]
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const renderSetting = useCallback(
    ([key, option]: [string, EditorOption]) => {
      const id = `setting-${key}`;

      // Helper to get boolean value regardless of format
      const getBooleanValue = (key: string) => {
        // @ts-expect-error - Monaco editor internal API
        const setting = settings[key.replace(".enabled", "")];
        if (typeof setting === "object" && setting !== null) {
          return setting.enabled;
        }
        return setting;
      };

      // Get value based on type
      const getValue = () => {
        if (option.type === "boolean") {
          return getBooleanValue(key);
        }
        // @ts-expect-error - Monaco editor internal API
        return settings[key];
      };

      const value = getValue();

      switch (option.type) {
        case "boolean":
          return (
            <div
              className="flex items-center justify-between space-x-4 pt-4 pb-3"
              key={key}
            >
              <Label className="font-medium text-sm" htmlFor={id}>
                {option.title}
              </Label>
              <Switch
                aria-label={option.title}
                checked={!!value}
                id={id}
                onCheckedChange={(checked) => updateSetting(key, checked)}
              />
            </div>
          );

        case "select":
          return (
            <div className="space-y-2 py-4" key={key}>
              <Label className="font-medium text-sm" htmlFor={id}>
                {option.title}
              </Label>
              <Select
                onValueChange={(value) => updateSetting(key, value)} // Ensure string value with fallback
                value={String(value || "")}
              >
                <SelectTrigger className="w-full" id={id}>
                  <SelectValue placeholder={`Select ${option.title}`} />
                </SelectTrigger>
                <SelectContent>
                  {option.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );

        case "number":
          return (
            <div className="space-y-2 py-4" key={key}>
              <Label className="font-medium text-sm" htmlFor={id}>
                {option.title}
              </Label>
              <Input
                aria-label={option.title}
                className="max-w-[calc(100%-50%)]"
                id={id} // Provide fallback for undefined
                onChange={(e) => updateSetting(key, Number(e.target.value))}
                type="number"
                value={value ?? ""}
              />
            </div>
          );

        default:
          return (
            <div className="space-y-2 py-4" key={key}>
              <Label className="font-medium text-sm" htmlFor={id}>
                {option.title}
              </Label>
              <Input
                aria-label={option.title}
                id={id}
                onChange={(e) => updateSetting(key, e.target.value)} // Convert to string and provide fallback
                type="text"
                value={String(value ?? "")}
              />
            </div>
          );
      }
    },
    [settings, updateSetting]
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: grouping editor configuration controls
    <div
      aria-label="Editor Configuration"
      className={cn("space-y-2", className)}
      role="group"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="absolute top-3 left-2.5 size-4 text-muted-foreground"
          />
          <Input
            aria-label="Search editor settings"
            className="pl-8"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settings..."
            type="search"
            value={search}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Import settings"
              onClick={handleImportClick}
              size="icon"
              variant="outline"
            >
              <Folder className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import Settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Export settings"
              onClick={() =>
                exportSettings(settings as Record<string, unknown>)
              }
              size="icon"
              variant="outline"
            >
              <Download className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="mr-1">Export Settings</TooltipContent>
        </Tooltip>
        <input
          accept=".json"
          aria-label="Import settings file"
          className="hidden"
          onChange={(e) => importSettings(editor, setSettings, e)}
          ref={fileInputRef}
          type="file"
        />
      </div>

      <div className="space-y-1 divide-y">
        {filteredSettings.length > 0 ? (
          filteredSettings.map(renderSetting)
        ) : (
          // biome-ignore lint/a11y/useSemanticElements: status div for empty state
          <div
            aria-live="polite"
            className="flex items-center justify-center py-8 text-center"
            role="status"
          >
            <p className="text-muted-foreground text-sm">
              {search ? "No settings found." : "No settings available."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

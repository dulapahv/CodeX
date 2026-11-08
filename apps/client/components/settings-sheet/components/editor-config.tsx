/**
 * The editor settings list. Common settings come first, then every other
 * setting in collapsible sections, with search across names and descriptions.
 * Only changed settings are saved, and they can be imported or exported.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import {
  DownloadSimpleIcon,
  FolderIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import type * as monacoEditor from "monaco-editor";
import { type ChangeEvent, useMemo, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  getSections,
  getSettingDefinitions,
  getSettingValue,
  isSameValue,
  type SettingDefinition,
  type SettingSection,
} from "../catalog";
import {
  cleanSettings,
  type EditorSettings,
  readStoredSettings,
  toEditorOptions,
  withoutSettingValue,
  withSettingValue,
  writeStoredSettings,
} from "../storage";
import { exportSettings } from "../utils";
import { SettingRow } from "./setting-row";

const DEFAULT_OPEN_SECTIONS = ["common"];

interface EditorConfigProps {
  className?: string;
  editor: monacoEditor.editor.IStandaloneCodeEditor;
  monaco: Monaco;
}

const matchesSearch = (setting: SettingDefinition, query: string) =>
  setting.title.toLowerCase().includes(query) ||
  setting.key.toLowerCase().includes(query) ||
  setting.description.toLowerCase().includes(query);

export function EditorConfig({ monaco, editor, className }: EditorConfigProps) {
  const definitions = useMemo(() => getSettingDefinitions(monaco), [monaco]);
  const sections = useMemo(() => getSections(definitions), [definitions]);
  const [settings, setSettings] = useState<EditorSettings>(() =>
    cleanSettings(readStoredSettings(), definitions)
  );
  const [search, setSearch] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveSettings = (next: EditorSettings) => {
    setSettings(next);
    writeStoredSettings(next);
  };

  const changeSetting = (setting: SettingDefinition, value: unknown) => {
    editor.updateOptions(toEditorOptions(setting.key, value));
    saveSettings(
      isSameValue(value, setting.defaultValue)
        ? withoutSettingValue(settings, setting.key)
        : withSettingValue(settings, setting.key, value)
    );
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      const imported = cleanSettings(
        JSON.parse(await file.text()),
        definitions
      );
      // Settings missing from the file go back to their defaults
      for (const setting of definitions) {
        const value = getSettingValue(imported, setting.key);
        const current = getSettingValue(settings, setting.key);
        if (value !== undefined || current !== undefined) {
          editor.updateOptions(
            toEditorOptions(setting.key, value ?? setting.defaultValue)
          );
        }
      }
      saveSettings(imported);
      setImportError(null);
    } catch {
      setImportError("Couldn't import settings. Check that it's a JSON file.");
    }
  };

  const renderSetting = (setting: SettingDefinition) => {
    const saved = getSettingValue(settings, setting.key);
    return (
      <SettingRow
        isModified={saved !== undefined}
        key={setting.key}
        onChange={(value) => changeSetting(setting, value)}
        onReset={() => changeSetting(setting, setting.defaultValue)}
        setting={setting}
        value={saved ?? setting.defaultValue}
      />
    );
  };

  const query = search.trim().toLowerCase();
  const results: SettingSection[] = query
    ? sections
        .slice(1)
        .map((section) => ({
          ...section,
          settings: section.settings.filter((setting) =>
            matchesSearch(setting, query)
          ),
        }))
        .filter((section) => section.settings.length > 0)
    : [];

  return (
    // biome-ignore lint/a11y/useSemanticElements: grouping editor configuration controls
    <div
      aria-label="Editor Configuration"
      className={cn("space-y-2", className)}
      role="group"
    >
      <div className="flex items-center gap-2">
        <InputGroup className="flex-1">
          <InputGroupInput
            aria-label="Search editor settings"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search settings..."
            type="search"
            value={search}
          />
          <InputGroupAddon>
            <MagnifyingGlassIcon aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Import settings"
                onClick={() => fileInputRef.current?.click()}
                size="icon"
                variant="outline"
              >
                <FolderIcon className="size-4" />
              </Button>
            }
          />
          <TooltipContent>Import Settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Export settings"
                onClick={() => exportSettings(settings)}
                size="icon"
                variant="outline"
              >
                <DownloadSimpleIcon className="size-4" />
              </Button>
            }
          />
          <TooltipContent className="mr-1">Export Settings</TooltipContent>
        </Tooltip>
        <input
          accept=".json,application/json"
          aria-label="Import settings file"
          className="hidden"
          onChange={importFile}
          ref={fileInputRef}
          type="file"
        />
      </div>
      {importError && (
        <p className="text-destructive text-xs" role="alert">
          {importError}
        </p>
      )}

      {query ? (
        <div aria-live="polite">
          {results.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No settings found.
            </p>
          ) : (
            results.map((section) => (
              <section aria-label={section.title} key={section.id}>
                <h4 className="text-muted-foreground pt-3 text-xs font-medium">
                  {section.title}
                </h4>
                <div className="divide-y">
                  {section.settings.map(renderSetting)}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <Accordion defaultValue={DEFAULT_OPEN_SECTIONS} multiple>
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="text-sm">
                <span className="flex items-baseline gap-2">
                  {section.title}
                  <span className="text-muted-foreground text-xs font-normal">
                    {section.settings.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="divide-y">
                  {section.settings.map(renderSetting)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

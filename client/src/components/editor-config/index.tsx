import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Monaco } from '@monaco-editor/react';
import { FileInput, Save, Search } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { EDITOR_SETTINGS_KEY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { EditorOption } from './types';
import {
  exportSettings,
  formatTitle,
  getOptionsForKey,
  importSettings,
} from './utils';

interface EditorConfigProps {
  monaco: Monaco;
  editor: monaco.editor.IStandaloneCodeEditor;
  className?: string;
}

export function EditorConfig({ monaco, editor, className }: EditorConfigProps) {
  const [search, setSearch] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    // Initialize with empty object to avoid undefined values
    const savedSettings = localStorage.getItem(EDITOR_SETTINGS_KEY);
    try {
      return savedSettings ? JSON.parse(savedSettings) : {};
    } catch (error) {
      console.error('Failed to load saved settings:', error);
      return {};
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface EditorOptionsInternal extends monaco.editor.IEditorOptions {
    _values: unknown[];
  }

  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem(EDITOR_SETTINGS_KEY);
      let initialSettings: Record<string, unknown> = {};

      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          initialSettings = parsed;
          editor.updateOptions(parsed);
        } catch (error) {
          console.error('Failed to load saved settings:', error);
        }
      }

      // Get current options for any missing settings
      // @ts-expect-error - Monaco editor internal API
      const values = (editor.getOptions() as EditorOptionsInternal)._values;
      const optionNames = Object.keys(monaco.editor.EditorOption).filter(
        (key) => isNaN(Number(key)),
      );

      const newSettings = { ...initialSettings };
      optionNames.forEach((key, index) => {
        if (key in initialSettings) return;

        const value = values[index];
        if (typeof value === 'object' && value !== null && 'enabled' in value) {
          newSettings[`${key}.enabled`] = value.enabled;
        } else if (
          typeof value !== 'object' &&
          value !== null &&
          value !== undefined
        ) {
          newSettings[key] = value;
        }
      });

      setSettings(newSettings);
    };

    loadSettings();
  }, [editor, monaco.editor.EditorOption]);

  const editorOptions = useMemo(() => {
    const options: Record<string, EditorOption> = {};
    // @ts-expect-error - Monaco editor internal API
    const values = (editor.getOptions() as EditorOptionsInternal)._values;

    Object.keys(monaco.editor.EditorOption)
      .filter((key) => isNaN(Number(key)))
      .forEach((key, index) => {
        const value = values[index];
        if (value === undefined) return;

        // Handle objects with 'enabled' property (like minimap)
        if (typeof value === 'object' && value !== null && 'enabled' in value) {
          options[`${key}.enabled`] = {
            title: formatTitle(key),
            type: 'boolean',
            currentValue: value.enabled,
          };
          return;
        }

        // Skip other objects or unsupported types
        if (typeof value === 'object' || value === null) return;

        const type = typeof value;
        if (!['boolean', 'string', 'number'].includes(type)) return;

        options[key] = {
          title: formatTitle(key),
          type:
            type === 'boolean'
              ? 'boolean'
              : type === 'number'
                ? 'number'
                : type === 'string' &&
                    typeof value === 'string' &&
                    ['on', 'off'].includes(value)
                  ? 'select'
                  : 'text',
          currentValue: value,
          options: type === 'string' ? getOptionsForKey(key) : undefined,
        };
      });

    return options;
  }, [editor, monaco.editor.EditorOption]);

  const filteredSettings = useMemo(() => {
    const searchLower = search.toLowerCase();
    return Object.entries(editorOptions).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, option]) => option.title.toLowerCase().includes(searchLower),
    );
  }, [search, editorOptions]);

  const updateSetting = useCallback(
    (key: string, value: unknown) => {
      // Handle enabled properties of objects (like minimap.enabled)
      if (key.endsWith('.enabled')) {
        const mainOption = key.replace('.enabled', '');
        // @ts-expect-error - Monaco editor internal API
        const values = (editor.getOptions() as EditorOptionsInternal)._values;
        const currentValue =
          values[
            Object.keys(monaco.editor.EditorOption)
              .filter((k) => isNaN(Number(k)))
              .indexOf(mainOption)
          ];

        if (typeof currentValue === 'object' && currentValue !== null) {
          const updatedOption = {
            ...currentValue,
            enabled: value,
          };
          editor.updateOptions({
            [mainOption]: updatedOption,
          });

          // Update settings after the editor update
          const newSettings = {
            ...settings,
            [key]: updatedOption.enabled, // Use the actual state from the updated option
          };
          setSettings(newSettings);

          try {
            localStorage.setItem(
              EDITOR_SETTINGS_KEY,
              JSON.stringify(newSettings),
            );
          } catch (error) {
            console.error('Failed to save settings:', error);
          }
        }
      } else {
        editor.updateOptions({ [key]: value });

        // Get the actual updated value from the editor
        // @ts-expect-error - Monaco editor internal API
        const updatedValues = (editor.getOptions() as EditorOptionsInternal)
          ._values;
        const optionIndex = Object.keys(monaco.editor.EditorOption)
          .filter((k) => isNaN(Number(k)))
          .indexOf(key);
        const actualValue = updatedValues[optionIndex];

        const newSettings = {
          ...settings,
          [key]: actualValue,
        };
        setSettings(newSettings);

        try {
          localStorage.setItem(
            EDITOR_SETTINGS_KEY,
            JSON.stringify(newSettings),
          );
        } catch (error) {
          console.error('Failed to save settings:', error);
        }
      }
    },
    [editor, settings, monaco.editor.EditorOption],
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const renderSetting = useCallback(
    ([key, option]: [string, EditorOption]) => {
      const id = `setting-${key}`;
      const value = settings[key] ?? '';

      switch (option.type) {
        case 'boolean':
          return (
            <div
              className="flex items-center justify-between space-x-4 pb-3 pt-4"
              key={key}
            >
              <Label htmlFor={id} className="text-sm font-medium">
                {option.title}
              </Label>
              <Switch
                id={id}
                checked={!!value} // Ensure boolean value
                onCheckedChange={(checked) => updateSetting(key, checked)}
                aria-label={option.title}
              />
            </div>
          );

        case 'select':
          return (
            <div className="space-y-2 py-4" key={key}>
              <Label htmlFor={id} className="text-sm font-medium">
                {option.title}
              </Label>
              <Select
                value={String(value || '')} // Ensure string value with fallback
                onValueChange={(value) => updateSetting(key, value)}
              >
                <SelectTrigger id={id} className="w-full">
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

        case 'number':
          return (
            <div className="space-y-2 py-4" key={key}>
              <Label htmlFor={id} className="text-sm font-medium">
                {option.title}
              </Label>
              <Input
                id={id}
                type="number"
                value={value ?? ''} // Provide fallback for undefined
                onChange={(e) => updateSetting(key, Number(e.target.value))}
                className="max-w-[calc(100%-50%)]"
                aria-label={option.title}
              />
            </div>
          );

        default:
          return (
            <div className="space-y-2 py-4" key={key}>
              <Label htmlFor={id} className="text-sm font-medium">
                {option.title}
              </Label>
              <Input
                id={id}
                type="text"
                value={String(value ?? '')} // Convert to string and provide fallback
                onChange={(e) => updateSetting(key, e.target.value)}
                aria-label={option.title}
              />
            </div>
          );
      }
    },
    [settings, updateSetting],
  );

  return (
    <div
      className={cn('space-y-2', className)}
      role="group"
      aria-label="Editor Configuration"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-2.5 top-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search settings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label="Search editor settings"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleImportClick}
              aria-label="Import settings"
            >
              <FileInput className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => exportSettings(settings)}
              aria-label="Export settings"
            >
              <Save className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="mr-1">Export settings</TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={(e) => importSettings(editor, setSettings, e)}
          className="hidden"
          aria-label="Import settings file"
        />
      </div>

      <div className="space-y-1 divide-y">
        {filteredSettings.map(renderSetting)}
      </div>
    </div>
  );
}

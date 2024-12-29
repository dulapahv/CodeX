import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import type { Monaco } from '@monaco-editor/react';
import { ArrowDownToLine, ArrowUpFromLine, Search } from 'lucide-react';
import type * as monaco from 'monaco-editor';
import { toast } from 'sonner';

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

interface EditorConfigProps {
  monaco: Monaco;
  editor: monaco.editor.IStandaloneCodeEditor;
  className?: string;
}

interface EditorOption {
  title: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'text';
  options?: string[];
  currentValue: unknown;
}

const EDITOR_SETTINGS_KEY = 'editor-settings';

// Helper to convert camelCase to Title Case
function formatTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}

// Helper to get options for select types
const getOptionsForKey = (key: string): string[] | undefined => {
  const commonOptions: Record<string, string[]> = {
    acceptSuggestionOnEnter: ['off', 'on', 'smart'],
    wordWrap: ['off', 'on', 'wordWrapColumn', 'bounded'],
    cursorStyle: [
      'line',
      'block',
      'underline',
      'line-thin',
      'block-outline',
      'underline-thin',
    ],
    cursorBlinking: ['blink', 'smooth', 'phase', 'expand', 'solid'],
    lineNumbers: ['off', 'on', 'relative', 'interval'],
  };

  return commonOptions[key] || ['on', 'off'];
};

export function EditorConfig({ monaco, editor, className }: EditorConfigProps) {
  const [search, setSearch] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settings, setSettings] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize settings from editor options
  // Add at the top with other interfaces
  interface EditorOptionsInternal extends monaco.editor.IEditorOptions {
    _values: unknown[];
  }

  // Then in your useEffect
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

      optionNames.forEach((key, index) => {
        if (key in initialSettings) return;

        const value = values[index];
        if (typeof value === 'object' && value !== null && 'enabled' in value) {
          initialSettings[`${key}.enabled`] = value.enabled;
        } else if (
          typeof value !== 'object' &&
          value !== null &&
          value !== undefined
        ) {
          initialSettings[key] = value;
        }
      });

      setSettings(initialSettings);
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
      const newSettings = {
        ...settings,
        [key]: value,
      };

      setSettings(newSettings);

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
          editor.updateOptions({
            [mainOption]: {
              ...currentValue,
              enabled: value,
            },
          });
        }
      } else {
        editor.updateOptions({ [key]: value });
      }

      try {
        localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },
    [editor, settings, monaco.editor.EditorOption],
  );

  const exportSettings = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kasca-editor-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Your editor settings have been exported successfully.');
    } catch (error) {
      console.error('Failed to export settings:', error);
      toast.error('Failed to export settings. Please try again.');
    }
  }, [settings]);

  const importSettings = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
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

          toast.success(
            'Your editor settings have been imported successfully.',
          );
        } catch (error) {
          console.error('Failed to import settings:', error);
          toast.error(
            'Failed to import settings. Please check the file format.',
          );
        }
      };

      reader.readAsText(file);
      event.target.value = '';
    },
    [editor],
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const renderSetting = useCallback(
    ([key, option]: [string, EditorOption]) => {
      const id = `setting-${key}`;
      const value = settings[key];

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
                checked={value}
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
                value={String(value)}
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
                value={value}
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
                value={String(value)}
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
            className="absolute left-2 top-3 size-4 text-muted-foreground"
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
              <ArrowDownToLine className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={exportSettings}
              aria-label="Export settings"
            >
              <ArrowUpFromLine className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="mr-1">Export settings</TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={importSettings}
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

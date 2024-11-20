import { useCallback, useEffect, useState } from 'react';
import type { Monaco } from '@monaco-editor/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import themeList from 'monaco-themes/themes/themelist.json';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EditorThemeSettingsProps {
  monaco: Monaco | null;
}

const setCSSVariables = (variables: Record<string, string>) => {
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

type ThemeConfig = {
  name: string;
  variables: Record<string, string>;
};

const DEFAULT_THEMES: Record<string, ThemeConfig> = {
  'vs-dark': {
    name: 'Dark (Visual Studio)',
    variables: {
      '--toolbar-bg-secondary': '#3c3c3c',
      '--panel-background': '#1e1e1e',
      '--toolbar-foreground': '#fff',
      '--toolbar-bg-primary': '#2678ca',
      '--toolbar-accent': '#2678ca',
      '--panel-text-accent': '#fff',
    },
  },
  light: {
    name: 'Light (Visual Studio)',
    variables: {
      '--toolbar-bg-secondary': '#dddddd',
      '--panel-background': '#fffffe',
      '--toolbar-foreground': '#000',
      '--toolbar-bg-primary': '#2678ca',
      '--toolbar-accent': '#2678ca',
      '--panel-text-accent': '#fff',
    },
  },
};

const EditorThemeSettings = ({ monaco }: EditorThemeSettingsProps) => {
  const { setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState('');

  // Load theme from localStorage on component mount
  useEffect(() => {
    const theme = localStorage.getItem('editorTheme');
    if (theme) {
      setEditorTheme(theme);
    }
  }, []);

  const handleThemeChange = useCallback(
    (key: string, value: string) => {
      const newTheme = key === editorTheme ? '' : key;
      setEditorTheme(newTheme);

      localStorage.setItem('editorTheme', newTheme);

      setOpen(false);

      if (key in DEFAULT_THEMES) {
        const themeConfig = DEFAULT_THEMES[key];
        setTheme(key === 'vs-dark' ? 'dark' : 'light');
        setCSSVariables(themeConfig.variables);
      } else {
        const themeData = require(`monaco-themes/themes/${value}.json`);

        setTheme(themeData.base === 'vs-dark' ? 'dark' : 'light');

        setCSSVariables({
          '--toolbar-bg-primary': themeData.colors[
            'editor.selectionBackground'
          ].slice(0, 7),
          '--toolbar-bg-secondary': themeData.colors[
            'editor.selectionBackground'
          ].slice(0, 7),
          '--toolbar-foreground': themeData.colors['editor.foreground'].slice(
            0,
            7,
          ),
          '--toolbar-accent': themeData.colors['editorCursor.foreground'].slice(
            0,
            7,
          ),
          '--panel-text-accent': themeData.colors['editor.background'].slice(
            0,
            7,
          ),
          '--panel-background': themeData.colors['editor.background'].slice(
            0,
            7,
          ),
        });
      }

      if (monaco) {
        monaco.editor.setTheme(key);
      }
    },
    [monaco, editorTheme, setTheme],
  );

  if (!monaco) return null;

  // Combine default and custom themes with explicit typing
  const themes = Object.entries({
    ...DEFAULT_THEMES,
    ...Object.fromEntries(
      Object.entries(themeList).map(([key, value]) => [key, { name: value }]),
    ),
  });

  return (
    <div className="flex flex-col gap-y-2">
      <Label className="font-normal">Theme</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {editorTheme
              ? themes.find(([key]) => key === editorTheme)?.[1].name
              : 'Select theme'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search theme..." />
            <CommandList>
              <CommandEmpty>No theme found.</CommandEmpty>
              <CommandGroup>
                {themes.map(([key, themeData]) => (
                  <CommandItem
                    key={key}
                    value={key}
                    onSelect={() => handleThemeChange(key, themeData.name)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        key === editorTheme ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {themeData.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export { EditorThemeSettings };

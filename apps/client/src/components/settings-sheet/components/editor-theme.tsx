/**
 * Editor theme selector component that manages Monaco editor themes.
 * Features:
 * - Theme synchronization with system/user preference
 * - Theme preview with CSS variable updates
 * - Theme persistence
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useEffect, useState } from 'react';

import type { Monaco } from '@monaco-editor/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import themeList from 'monaco-themes/themes/themelist.json';
import { useTheme } from 'next-themes';

import {
  applyEditorTheme,
  initEditorTheme,
  registerMonaco,
} from '@/lib/init-editor-theme';
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
  monaco: Monaco;
}

const DEFAULT_THEMES = {
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
  const [editorTheme, setEditorTheme] = useState('vs-dark'); // Set default theme

  // Register Monaco when the component mounts
  useEffect(() => {
    if (monaco) {
      registerMonaco(monaco);
    }
  }, [monaco]);

  // Run the init function once and sync with next-themes
  useEffect(() => {
    // Initialize editor theme
    initEditorTheme();

    // Load saved theme to update the UI
    const savedTheme = localStorage.getItem('editorTheme');
    if (savedTheme) {
      setEditorTheme(savedTheme);

      // Also sync with next-themes
      if (savedTheme === 'vs-dark') {
        setTheme('dark');
      } else if (savedTheme in DEFAULT_THEMES) {
        setTheme('light');
      } else {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const themeData = require(
            `monaco-themes/themes/${themeList[savedTheme as keyof typeof themeList]}.json`,
          );
          setTheme(themeData.base === 'vs-dark' ? 'dark' : 'light');
        } catch (error) {
          console.error('Failed to sync theme:', error);
        }
      }
    }
  }, [setTheme]);

  const handleThemeChange = (key: string, value: string) => {
    setEditorTheme(key);
    setOpen(false);

    // Apply the theme and get the appropriate next-theme value
    const nextTheme = applyEditorTheme(key, value);

    // Update next-themes
    setTheme(nextTheme);
  };

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
            {themes.find(([key]) => key === editorTheme)?.[1].name ||
              'Dark (Visual Studio)'}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="max-h-[--radix-popover-content-available-height]
            w-[--radix-popover-trigger-width] p-0"
        >
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
                        'mr-2 size-4',
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

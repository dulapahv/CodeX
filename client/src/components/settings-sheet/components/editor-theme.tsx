import { useCallback, useEffect, useState } from 'react';
import type { Monaco } from '@monaco-editor/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import themeList from 'monaco-themes/themes/themelist.json';

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

const EditorThemeSettings = ({ monaco }: EditorThemeSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState('');

  useEffect(() => {
    const theme = localStorage.getItem('editorTheme');
    if (theme) {
      setEditorTheme(theme);
    }
  }, []);

  const handleThemeChange = useCallback(
    (key: string, value: string) => {
      setEditorTheme(key === editorTheme ? '' : key);
      localStorage.setItem('editorTheme', key);
      setOpen(false);

      if (key === 'vs-dark' || key === 'light') {
        document.documentElement.style.setProperty(
          '--toolbar-bg-primary',
          '#2678ca',
        );
        document.documentElement.style.setProperty(
          '--toolbar-bg-secondary',
          '#3c3c3c',
        );
        document.documentElement.style.setProperty(
          '--toolbar-foreground',
          '#fff',
        );
      } else {
        const themeData = require(`monaco-themes/themes/${value}.json`);
        document.documentElement.style.setProperty(
          '--toolbar-bg-primary',
          themeData.colors['editor.selectionBackground'].slice(0, 7),
        );
        document.documentElement.style.setProperty(
          '--toolbar-bg-secondary',
          themeData.colors['editor.selectionBackground'].slice(0, 7),
        );
        document.documentElement.style.setProperty(
          '--toolbar-foreground',
          themeData.colors['editor.foreground'],
        );
      }

      if (monaco) {
        monaco.editor.setTheme(key);
      }
    },
    [monaco, editorTheme],
  );

  if (!monaco) return null;

  const defaultTheme = {
    'vs-dark': 'Dark (Visual Studio)',
    light: 'Light (Visual Studio)',
  };

  const themes = Object.entries({ ...defaultTheme, ...themeList });

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
              ? themes.find(([key]) => key === editorTheme)?.[1]
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
                {themes.map(([key, value]) => (
                  <CommandItem
                    key={key}
                    value={key}
                    onSelect={() => handleThemeChange(key, value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        key === editorTheme ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {value}
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

/**
 * Language selector component for Monaco editor.
 * Features:
 * - Language switching
 * - Search and filtering
 * - Synchronized language state
 * - Mobile support
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Monaco } from '@monaco-editor/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import type * as monaco from 'monaco-editor';
import { isMobile } from 'react-device-detect';

import { CodeServiceMsg } from '@codex/types/message';

import { getSocket } from '@/lib/socket';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Language {
  alias: string;
  extensions: string[];
  id: string;
}

interface LanguageSelectionProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  defaultLanguage?: string;
  className?: string;
}

const LanguageSelection = memo(
  ({
    monaco,
    editor,
    defaultLanguage = 'html',
    className,
  }: LanguageSelectionProps) => {
    const socket = useMemo(() => getSocket(), []);

    const [open, setOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);

    // Memoize languages array to prevent unnecessary recalculations
    const languages = useMemo(() => {
      if (!monaco) return [];

      return monaco.languages.getLanguages().map(
        (language) =>
          ({
            alias: language.aliases?.[0] || 'Unknown',
            extensions: language.extensions || [],
            id: language.id,
          }) as Language,
      );
    }, [monaco]);

    const handleSelect = useCallback(
      (currentValue: string) => {
        const newLanguage = currentValue.split('$')[0];
        setSelectedLanguage(newLanguage);
        setOpen(false);

        const model = editor?.getModel();
        if (!model || !monaco) return;

        const selectedLang = languages.find((l) => l.alias === newLanguage);
        monaco.editor.setModelLanguage(model, selectedLang?.id || 'plaintext');
      },
      [editor, monaco, languages],
    );

    // Sync with editor's current language
    useEffect(() => {
      if (!editor || !monaco) return;

      const model = editor.getModel();
      if (!model) return;

      const handleLanguageChange = (langID: string) => {
        const model = editor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, langID);
        }
      };

      socket.emit(CodeServiceMsg.SYNC_LANG);
      socket.on(CodeServiceMsg.UPDATE_LANG, handleLanguageChange);

      // Get initial language
      const currentLanguage = model.getLanguageId();
      const language = monaco.languages
        .getLanguages()
        .find((lang) => lang.id === currentLanguage);
      if (language?.aliases?.[0]) {
        setSelectedLanguage(language.aliases[0]);
      }

      // Listen for language changes
      const disposable = model.onDidChangeLanguage((e) => {
        const newLanguage = monaco.languages
          .getLanguages()
          .find((lang) => lang.id === e.newLanguage);
        if (newLanguage?.aliases?.[0]) {
          setSelectedLanguage(newLanguage.aliases[0]);
          socket.emit(CodeServiceMsg.UPDATE_LANG, newLanguage.id);
        }
      });

      return () => {
        socket.off(CodeServiceMsg.UPDATE_LANG, handleLanguageChange);
        disposable.dispose();
      };
    }, [editor, monaco, socket]);

    if (!monaco || !editor) return null;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            aria-label="Select programming language"
            className={cn(
              'size-fit justify-between gap-x-1 rounded-sm p-0 pl-2 pr-1 text-xs',
              className,
            )}
          >
            {selectedLanguage}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="mr-1 w-64 p-0"
          sideOffset={8}
          onOpenAutoFocus={(event) => {
            if (isMobile) event.preventDefault();
          }}
        >
          <Command>
            <CommandInput placeholder="Search languages..." className="h-9" />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup>
                {languages.map((language) => (
                  <CommandItem
                    key={language.id}
                    value={`${language.alias}$${language.extensions.join(', ')}`}
                    onSelect={handleSelect}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{language.alias}</span>
                      {language.extensions.length > 0 && (
                        <span className="text-muted-foreground text-xs">
                          {language.extensions.join(', ')}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        'ml-2 size-4 flex-shrink-0 transition-opacity',
                        selectedLanguage === language.alias
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

LanguageSelection.displayName = 'LanguageSelection';

export { LanguageSelection };

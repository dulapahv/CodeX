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

import { CodeServiceMsg } from "@codex/types/message";

import type { Monaco } from "@monaco-editor/react";
import { Check, ChevronsUpDown } from "lucide-react";
import type * as monaco from "monaco-editor";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { isMobile } from "react-device-detect";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

interface Language {
  alias: string;
  extensions: string[];
  id: string;
}

interface LanguageSelectionProps {
  className?: string;
  defaultLanguage?: string;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}

const LanguageSelection = memo(
  ({
    monaco,
    editor,
    defaultLanguage = "html",
    className,
  }: LanguageSelectionProps) => {
    const socket = useMemo(() => getSocket(), []);

    const [open, setOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);

    // Memoize languages array to prevent unnecessary recalculations
    const languages = useMemo(() => {
      if (!monaco) {
        return [];
      }

      return monaco.languages.getLanguages().map(
        (language) =>
          ({
            alias: language.aliases?.[0] || "Unknown",
            extensions: language.extensions || [],
            id: language.id,
          }) as Language
      );
    }, [monaco]);

    const handleSelect = useCallback(
      (currentValue: string) => {
        const newLanguage = currentValue.split("$")[0];
        setSelectedLanguage(newLanguage);
        setOpen(false);

        const model = editor?.getModel();
        if (!(model && monaco)) {
          return;
        }

        const selectedLang = languages.find((l) => l.alias === newLanguage);
        monaco.editor.setModelLanguage(model, selectedLang?.id || "plaintext");
      },
      [editor, monaco, languages]
    );

    // Sync with editor's current language
    useEffect(() => {
      if (!(editor && monaco)) {
        return;
      }

      const model = editor.getModel();
      if (!model) {
        return;
      }

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

    if (!(monaco && editor)) {
      return null;
    }

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            aria-label="Select programming language"
            className={cn(
              "size-fit justify-between gap-x-1 rounded-sm p-0 pr-1 pl-2 text-xs",
              className
            )}
            role="combobox"
            variant="ghost"
          >
            {selectedLanguage}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="mr-1 w-64 p-0"
          onOpenAutoFocus={(event) => {
            if (isMobile) {
              event.preventDefault();
            }
          }}
          sideOffset={8}
        >
          <Command>
            <CommandInput className="h-9" placeholder="Search languages..." />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup>
                {languages.map((language) => (
                  <CommandItem
                    className="flex items-center justify-between"
                    key={language.id}
                    onSelect={handleSelect}
                    value={`${language.alias}$${language.extensions.join(", ")}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{language.alias}</span>
                      {language.extensions.length > 0 && (
                        <span className="text-muted-foreground text-xs">
                          {language.extensions.join(", ")}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-2 size-4 flex-shrink-0 transition-opacity",
                        selectedLanguage === language.alias
                          ? "opacity-100"
                          : "opacity-0"
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
  }
);

LanguageSelection.displayName = "LanguageSelection";

export { LanguageSelection };

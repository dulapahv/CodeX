/**
 * Language picker for the open file, in the status bar.
 * Features:
 * - Search by name or extension
 * - Changes the file's language for everyone
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CheckIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
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
import { useWorkbench } from "@/components/workbench/workbench-provider";
import { cn } from "@/lib/utils";

interface Language {
  alias: string;
  extensions: string[];
  id: string;
}

const LanguageSelection = ({ className }: { className?: string }) => {
  const { files, monaco } = useWorkbench();
  const [open, setOpen] = useState(false);
  const { activeFile } = files;

  const languages = useMemo<Language[]>(
    () =>
      monaco?.languages.getLanguages().map((language) => ({
        alias: language.aliases?.[0] ?? language.id,
        extensions: language.extensions ?? [],
        id: language.id,
      })) ?? [],
    [monaco]
  );

  if (!activeFile) {
    return null;
  }

  const current = languages.find(({ id }) => id === activeFile.language);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-expanded={open}
            aria-label="Select programming language"
            className={cn("h-full text-xs font-normal", className)}
            role="combobox"
            variant="ghost"
          >
            {current?.alias ?? activeFile.language}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-64 p-0"
        side="top"
        sideOffset={4}
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
                  onSelect={() => {
                    setOpen(false);
                    files.setLanguage(activeFile.id, language.id);
                  }}
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
                  <CheckIcon
                    className={cn(
                      "ml-2 size-4 flex-shrink-0 transition-opacity",
                      language.id === activeFile.language
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
};

export { LanguageSelection };

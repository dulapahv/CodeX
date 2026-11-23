/**
 * Picks the colour theme from a list like VS Code's, trying each one as you
 * move through it and putting the old one back if you leave without picking.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { useTheme } from "next-themes";
import { useRef, useState } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  applyEditorTheme,
  type EditorThemeOption,
  getEditorThemes,
} from "@/lib/init-editor-theme";

const readSavedTheme = () => {
  try {
    return localStorage.getItem("editorTheme");
  } catch {
    return null;
  }
};

interface ThemePickerProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export const ThemePicker = ({ onOpenChange, open }: ThemePickerProps) => {
  const { setTheme } = useTheme();
  const themes = getEditorThemes();
  const [highlighted, setHighlighted] = useState("");
  const [originalKey, setOriginalKey] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  const isChosenRef = useRef(false);

  // Starts on the current theme each time it opens
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const savedKey = readSavedTheme();
      setOriginalKey(savedKey);
      setHighlighted(themes.find(({ key }) => key === savedKey)?.name ?? "");
    }
  }

  const apply = (theme: EditorThemeOption | undefined) => {
    if (theme) {
      setTheme(applyEditorTheme(theme.key, theme.name));
    }
  };

  const preview = (name: string) => {
    setHighlighted(name);
    apply(themes.find((theme) => theme.name === name));
  };

  const close = (next: boolean) => {
    if (!next) {
      if (!isChosenRef.current) {
        apply(themes.find(({ key }) => key === originalKey));
      }
      isChosenRef.current = false;
    }
    onOpenChange(next);
  };

  const choose = (theme: EditorThemeOption) => {
    isChosenRef.current = true;
    apply(theme);
    close(false);
  };

  const renderGroup = (heading: string, isDark: boolean) => (
    <CommandGroup heading={heading}>
      {themes
        .filter((theme) => theme.isDark === isDark)
        .map((theme) => (
          <CommandItem
            data-checked={theme.key === originalKey}
            key={theme.key}
            onSelect={() => choose(theme)}
            value={theme.name}
          >
            {theme.name}
          </CommandItem>
        ))}
    </CommandGroup>
  );

  return (
    <CommandDialog
      className="top-2 sm:max-w-xl"
      description="Pick a colour theme, trying each one as you move through the list"
      onOpenChange={close}
      open={open}
      title="Color Theme"
    >
      {/* Moving the mouse doesn't switch themes, only the keys and clicks do */}
      <Command
        data-command-palette=""
        disablePointerSelection
        loop
        onValueChange={preview}
        value={highlighted}
      >
        <CommandInput
          aria-label="Color theme"
          placeholder="Select Color Theme (Up/Down Keys to Preview)"
        />
        <CommandList className="max-h-[min(24rem,60vh)]">
          <CommandEmpty>No matching themes</CommandEmpty>
          {renderGroup("Light Themes", false)}
          {renderGroup("Dark Themes", true)}
        </CommandList>
      </Command>
    </CommandDialog>
  );
};

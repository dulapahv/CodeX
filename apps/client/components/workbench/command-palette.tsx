/**
 * The command palette: every menu command plus the editor's own, searched by
 * name, with the ones used last at the top.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type * as monacoEditor from "monaco-editor";
import { useRef, useState } from "react";

import {
  createMenuConfig,
  EDITING_ACTIONS,
} from "@/components/toolbar/menu-config";
import type {
  ShortcutPlatform,
  ToolbarActions,
} from "@/components/toolbar/types";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useRoomAccess } from "@/lib/realtime/room-context";

import type { WorkbenchLayout } from "./types";

type Editor = monacoEditor.editor.IStandaloneCodeEditor;

export const PALETTE_ACTION_ID = "codex.showAllCommands";

// Switching to high contrast would change only the editor, not the room
const HIDDEN_EDITOR_ACTIONS = new Set([
  PALETTE_ACTION_ID,
  "editor.action.toggleHighContrast",
]);

const RECENT_KEY = "codex-recent-commands";
const MAX_RECENT = 5;
const TRAILING_ELLIPSIS = /(?:…|\.\.\.)$/u;

interface PaletteCommand {
  id: string;
  label: string;
  run: () => void;
  shortcut?: string;
}

const readRecent = (): string[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
};

const rememberCommand = (id: string) => {
  try {
    const recent = [id, ...readRecent().filter((saved) => saved !== id)];
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT))
    );
  } catch {
    // Storage can be blocked, which only loses the recent list
  }
};

const normalize = (label: string) =>
  label.replace(TRAILING_ELLIPSIS, "").toLowerCase();

// Monaco keeps its shortcut lookup private, so if that changes the editor's
// commands just show without a shortcut
const getEditorShortcut = (editor: Editor, id: string) => {
  const service: unknown = Reflect.get(editor, "_standaloneKeybindingService");
  if (
    !(
      typeof service === "object" &&
      service !== null &&
      "lookupKeybinding" in service &&
      typeof service.lookupKeybinding === "function"
    )
  ) {
    return;
  }
  const binding: unknown = service.lookupKeybinding(id);
  if (
    typeof binding === "object" &&
    binding !== null &&
    "getLabel" in binding &&
    typeof binding.getLabel === "function"
  ) {
    const label: unknown = binding.getLabel();
    return typeof label === "string" ? label : undefined;
  }
};

const buildCommands = (
  actions: ToolbarActions,
  editor: Editor,
  layout: WorkbenchLayout,
  platform: ShortcutPlatform,
  canEdit: boolean
) => {
  const commands: PaletteCommand[] = [];
  const labels = new Set<string>();

  for (const group of createMenuConfig(platform, layout)) {
    for (const item of group.items) {
      if (
        item === "separator" ||
        item.action === "commandPalette" ||
        (!canEdit && EDITING_ACTIONS.has(item.action))
      ) {
        continue;
      }
      labels.add(normalize(item.label));
      const name =
        item.type === "checkbox" ? `Toggle ${item.label}` : item.label;
      commands.push({
        id: item.action,
        label: `${group.label}: ${name}`,
        run: actions[item.action],
        shortcut: item.shortcut,
      });
    }
  }

  for (const action of editor.getSupportedActions()) {
    const label = normalize(action.label);
    if (!label || HIDDEN_EDITOR_ACTIONS.has(action.id) || labels.has(label)) {
      continue;
    }
    labels.add(label);
    commands.push({
      id: action.id,
      label: action.label,
      run: () => {
        editor.focus();
        editor.trigger("commandPalette", action.id, null);
      },
      shortcut: getEditorShortcut(editor, action.id),
    });
  }

  return commands;
};

interface PaletteContents {
  commands: PaletteCommand[];
  recentIds: string[];
}

interface CommandPaletteProps {
  actions: ToolbarActions;
  editor: Editor;
  layout: WorkbenchLayout;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  platform: ShortcutPlatform;
}

export const CommandPalette = ({
  actions,
  editor,
  layout,
  onOpenChange,
  open,
  platform,
}: CommandPaletteProps) => {
  const pendingRef = useRef<PaletteCommand | null>(null);
  const { canEdit } = useRoomAccess();
  const [wasOpen, setWasOpen] = useState(open);
  const [contents, setContents] = useState<PaletteContents>({
    commands: [],
    recentIds: [],
  });

  // Built as it opens, so it lists what the editor supports right now, and
  // kept while it closes so the list doesn't empty mid-animation
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setContents({
        commands: buildCommands(actions, editor, layout, platform, canEdit),
        recentIds: readRecent(),
      });
    }
  }

  const { commands, recentIds } = contents;
  const recent = recentIds
    .map((id) => commands.find((command) => command.id === id))
    .filter((command) => command !== undefined);
  const others = commands.filter((command) => !recentIds.includes(command.id));

  const choose = (command: PaletteCommand) => {
    pendingRef.current = command;
    rememberCommand(command.id);
    onOpenChange(false);
  };

  // Runs once the palette has closed and handed focus back, so editor
  // commands find the editor focused
  const runPending = (isOpen: boolean) => {
    const command = pendingRef.current;
    if (isOpen || !command) {
      return;
    }
    pendingRef.current = null;
    command.run();
  };

  const renderItem = (command: PaletteCommand) => (
    <CommandItem
      key={command.id}
      onSelect={() => choose(command)}
      value={command.label}
    >
      <span className="truncate">{command.label}</span>
      {command.shortcut && (
        <CommandShortcut className="tracking-normal">
          {command.shortcut}
        </CommandShortcut>
      )}
    </CommandItem>
  );

  return (
    <CommandDialog
      className="top-2 sm:max-w-xl"
      description="Search for a command to run"
      onOpenChange={onOpenChange}
      onOpenChangeComplete={runPending}
      open={open}
      title="Command Palette"
    >
      <Command data-command-palette="" loop>
        <CommandInput
          aria-label="Command"
          placeholder="Type the name of a command to run"
        />
        <CommandList className="max-h-[min(24rem,60vh)]">
          <CommandEmpty>No matching commands</CommandEmpty>
          {recent.length > 0 && (
            <CommandGroup heading="Recently used">
              {recent.map(renderItem)}
            </CommandGroup>
          )}
          <CommandGroup
            heading={recent.length > 0 ? "Other commands" : undefined}
          >
            {others.map(renderItem)}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};

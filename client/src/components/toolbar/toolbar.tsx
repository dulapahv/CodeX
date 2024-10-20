import { useEffect, useState } from "react";
import { Monaco } from "@monaco-editor/react";
import { Menu } from "lucide-react";
import * as monaco from "monaco-editor";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";

interface ToolbarProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

export function Toolbar({ monaco, editor }: ToolbarProps) {
  const [miniMap, setMiniMap] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  useEffect(() => {
    if (editor && monaco) {
      setMiniMap(editor.getOption(monaco.editor.EditorOption.minimap).enabled);
      setWordWrap(
        editor.getOption(monaco.editor.EditorOption.wordWrap) === "on",
      );
    }
  }, [editor, monaco]);

  if (!monaco || !editor) return null;

  function handleNewFile() {
    // Implement new file logic
    console.log("New file");
  }

  function handleOpenFile() {
    // Implement open file logic
    console.log("Open file");
  }

  function handleSaveFile() {
    // Open save file dialog
    console.log("Save file");
  }

  const actions = {
    undo: () => editor.trigger("keyboard", "undo", null),
    redo: () => editor.trigger("keyboard", "redo", null),
    cut: () =>
      editor.trigger("keyboard", "editor.action.clipboardCutAction", null),
    copy: () =>
      editor.trigger("keyboard", "editor.action.clipboardCopyAction", null),
    paste: () =>
      editor.trigger("keyboard", "editor.action.clipboardPasteAction", null),
    find: () => editor.trigger("keyboard", "actions.find", null),
    replace: () =>
      editor.trigger("keyboard", "editor.action.startFindReplaceAction", null),
    selectAll: () =>
      editor.trigger("keyboard", "editor.action.selectAll", null),
    copyLineUp: () =>
      editor.trigger("keyboard", "editor.action.copyLinesUpAction", null),
    copyLineDown: () =>
      editor.trigger("keyboard", "editor.action.copyLinesDownAction", null),
    moveLineUp: () =>
      editor.trigger("keyboard", "editor.action.moveLinesUpAction", null),
    moveLineDown: () =>
      editor.trigger("keyboard", "editor.action.moveLinesDownAction", null),
    duplicateSelection: () =>
      editor.trigger("keyboard", "editor.action.duplicateSelection", null),
    addCursorAbove: () =>
      editor.trigger("keyboard", "editor.action.insertCursorAbove", null),
    addCursorBelow: () =>
      editor.trigger("keyboard", "editor.action.insertCursorBelow", null),
    commandPalette: () =>
      editor.trigger("anyString", "editor.action.quickCommand", {}),
    minimap: () => {
      editor.updateOptions({ minimap: { enabled: !miniMap } });
      setMiniMap(!miniMap);
    },
    wordWrap: () => {
      editor.updateOptions({ wordWrap: wordWrap ? "off" : "on" });
      setWordWrap(!wordWrap);
    },
  };

  return (
    <>
      {/* Desktop menu */}
      <Menubar
        onValueChange={(value) => {
          if (!value) editor.focus();
        }}
        className="hidden h-fit animate-fade-in border-none bg-transparent p-0 sm:flex"
      >
        <MenubarMenu>
          <MenubarTrigger className="px-2 py-1 font-normal">
            File
          </MenubarTrigger>
          <MenubarContent className="ml-1" loop>
            <MenubarItem onSelect={handleNewFile}>
              New File <MenubarShortcut>Ctrl+N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={handleOpenFile}>
              Open File... <MenubarShortcut>Ctrl+O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={handleSaveFile}>
              Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              Settings <MenubarShortcut>Ctrl+,</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              Close File <MenubarShortcut>Ctrl+W</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Leave Room <MenubarShortcut>Ctrl+Q</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="px-2 py-1 font-normal">
            Edit
          </MenubarTrigger>
          <MenubarContent className="ml-1" loop>
            <MenubarItem onSelect={actions.undo}>
              Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.redo}>
              Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={actions.cut}>
              Cut <MenubarShortcut>Ctrl+X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.copy}>
              Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.paste}>
              Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={actions.find}>
              Find <MenubarShortcut>Ctrl+F</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.replace}>
              Replace <MenubarShortcut>Ctrl+H</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="px-2 py-1 font-normal">
            Selection
          </MenubarTrigger>
          <MenubarContent className="ml-1" loop>
            <MenubarItem onSelect={actions.selectAll}>
              Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={actions.copyLineUp}>
              Copy Line Up <MenubarShortcut>Shift+Alt+↑</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.copyLineDown}>
              Copy Line Down <MenubarShortcut>Shift+Alt+↓</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.moveLineUp}>
              Move Line Up <MenubarShortcut>Alt+↑</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.moveLineDown}>
              Move Line Down <MenubarShortcut>Alt+↓</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.duplicateSelection}>
              Duplicate Selection
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={actions.addCursorAbove}>
              Add Cursor Above <MenubarShortcut>Ctrl+Alt+↑</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={actions.addCursorBelow}>
              Add Cursor Below <MenubarShortcut>Ctrl+Alt+↓</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="px-2 py-1 font-normal">
            View
          </MenubarTrigger>
          <MenubarContent className="ml-1" loop>
            <MenubarItem onSelect={actions.commandPalette}>
              Command Palette <MenubarShortcut>F1</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarCheckboxItem checked>Status Bar</MenubarCheckboxItem>
            <MenubarCheckboxItem
              onCheckedChange={actions.minimap}
              checked={miniMap}
            >
              Minimap
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              onCheckedChange={actions.wordWrap}
              checked={wordWrap}
            >
              Word Wrap
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="px-2 py-1 font-normal">
            Help
          </MenubarTrigger>
          <MenubarContent className="ml-1" loop>
            <MenubarItem>Documentation</MenubarItem>
            <MenubarItem>About</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      {/* Mobile menu */}
      <Menubar className="flex h-fit animate-fade-in border-none bg-transparent p-0 sm:hidden">
        <MenubarMenu>
          <MenubarTrigger className="px-2 py-1">
            <Menu className="size-5" />
          </MenubarTrigger>
          <MenubarContent className="ml-1">
            <MenubarSub>
              <MenubarSubTrigger className="px-2 py-1 font-normal">
                File
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onSelect={handleNewFile}>New File</MenubarItem>
                <MenubarItem onSelect={handleOpenFile}>
                  Open File...
                </MenubarItem>
                <MenubarItem onSelect={handleSaveFile}>Save</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Settings</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Close File</MenubarItem>
                <MenubarItem>Leave Room</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger className="px-2 py-1 font-normal">
                Edit
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onSelect={actions.undo}>Undo</MenubarItem>
                <MenubarItem onSelect={actions.redo}>Redo</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={actions.cut}>Cut</MenubarItem>
                <MenubarItem onSelect={actions.copy}>Copy</MenubarItem>
                <MenubarItem onSelect={actions.paste}>Paste</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={actions.find}>Find</MenubarItem>
                <MenubarItem onSelect={actions.replace}>Replace</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger className="px-2 py-1 font-normal">
                Selection
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onSelect={actions.selectAll}>
                  Select All
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={actions.copyLineUp}>
                  Copy Line Up
                </MenubarItem>
                <MenubarItem onSelect={actions.copyLineDown}>
                  Copy Line Down
                </MenubarItem>
                <MenubarItem onSelect={actions.moveLineUp}>
                  Move Line Up
                </MenubarItem>
                <MenubarItem onSelect={actions.moveLineDown}>
                  Move Line Down
                </MenubarItem>
                <MenubarItem onSelect={actions.duplicateSelection}>
                  Duplicate Selection
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={actions.addCursorAbove}>
                  Add Cursor Above
                </MenubarItem>
                <MenubarItem onSelect={actions.addCursorBelow}>
                  Add Cursor Below
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger className="px-2 py-1 font-normal">
                View
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onSelect={actions.commandPalette}>
                  Command Palette
                </MenubarItem>
                <MenubarSeparator />
                <MenubarCheckboxItem checked>Status Bar</MenubarCheckboxItem>
                <MenubarCheckboxItem
                  onCheckedChange={actions.minimap}
                  checked={miniMap}
                >
                  Minimap
                </MenubarCheckboxItem>
                <MenubarCheckboxItem
                  onCheckedChange={actions.wordWrap}
                  checked={wordWrap}
                >
                  Word Wrap
                </MenubarCheckboxItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger className="px-2 py-1 font-normal">
                Help
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Documentation</MenubarItem>
                <MenubarItem>About</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  );
}
